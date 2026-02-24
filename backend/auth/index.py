import json
import os
import random
import string
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1259797_service_booking_app")
ADMIN_LOGIN = "avtoserv"
ADMIN_PASSWORD = "avtooil12"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Авторизация: отправка OTP по SMS и вход администратора."""
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

        # В реальной системе здесь отправка SMS через провайдера
        # Сейчас код возвращаем в ответе для демо-режима
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": True, "demo_code": code, "message": "Код отправлен"}),
        }

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

        # Найти или создать пользователя
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

    # POST /admin-login — вход администратора
    if method == "POST" and path.endswith("/admin-login"):
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
