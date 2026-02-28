import json
import os
import random
import string
import urllib.request
import urllib.parse
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1259797_service_booking_app")
ADMIN_LOGIN = "avtoserv"
ADMIN_PASSWORD = "avtooil12"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_sms(phone: str, message: str) -> bool:
    """Отправка SMS через smsc.ru. Возвращает True при успехе."""
    smsc_login = os.environ.get("SMSC_LOGIN", "")
    smsc_password = os.environ.get("SMSC_PASSWORD", "")
    if not smsc_login or not smsc_password:
        return False
    # Убираем +, smsc принимает 7XXXXXXXXXX
    clean_phone = phone.lstrip("+")
    params = urllib.parse.urlencode({
        "login": smsc_login,
        "psw": smsc_password,
        "phones": clean_phone,
        "mes": message,
        "fmt": 3,  # JSON ответ
        "charset": "utf-8",
    })
    url = f"https://smsc.ru/sys/send.php?{params}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return "error" not in result
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """Авторизация: отправка OTP по SMS через smsc.ru и вход администратора."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # POST /send-otp — отправить код
    if method == "POST" and path.endswith("/send-otp"):
        phone = body.get("phone", "").strip()
        if not phone:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите номер телефона"})}

        code = "".join(random.choices(string.digits, k=4))
        expires = datetime.now() + timedelta(minutes=5)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.otp_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
            (phone, code, expires),
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.sms_log (phone, message, type) VALUES (%s, %s, 'otp')",
            (phone, f"Ваш код: {code}"),
        )
        conn.commit()
        cur.close()
        conn.close()

        sms_text = f"АвтоСервис: ваш код входа {code}. Никому не сообщайте."
        sms_sent = send_sms(phone, sms_text)

        response = {"ok": True, "message": "Код отправлен"}
        # Если SMS не отправлена (нет ключей/ошибка) — возвращаем код для демо
        if not sms_sent:
            response["demo_code"] = code

        return {"statusCode": 200, "headers": cors, "body": json.dumps(response)}

    # POST /verify-otp — проверить код
    if method == "POST" and path.endswith("/verify-otp"):
        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()
        if not phone or not code:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите телефон и код"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.otp_codes WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
            (phone, code),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный или устаревший код"})}

        otp_id = row[0]
        cur.execute(f"UPDATE {SCHEMA}.otp_codes SET used=TRUE WHERE id=%s", (otp_id,))

        cur.execute(f"SELECT id, name FROM {SCHEMA}.users WHERE phone=%s", (phone,))
        user_row = cur.fetchone()
        if user_row:
            user_id, name = user_row
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (phone) VALUES (%s) RETURNING id, name",
                (phone,),
            )
            user_id, name = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": True, "user_id": user_id, "phone": phone, "name": name or ""}),
        }

    # POST /admin-login или action=x7k2m9 — вход администратора
    if method == "POST" and (path.endswith("/admin-login") or body.get("action") == "x7k2m9"):
        login = body.get("login", "")
        password = body.get("password", "")
        if login == ADMIN_LOGIN and password == ADMIN_PASSWORD:
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({"ok": True, "role": "admin", "token": "admin_secret_token_2024"}),
            }
        return {"statusCode": 401, "headers": cors, "body": json.dumps({"error": "Неверный логин или пароль"})}

    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}