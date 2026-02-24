import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1259797_service_booking_app")
ADMIN_TOKEN = "admin_secret_token_2024"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_admin(event):
    token = event.get("headers", {}).get("X-Auth-Token", "")
    return token == ADMIN_TOKEN


def handler(event: dict, context) -> dict:
    """Административные функции: пользователи, заявки, SMS-рассылки."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    if not check_admin(event):
        return {"statusCode": 403, "headers": cors, "body": json.dumps({"error": "Нет доступа"})}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # GET /users — все пользователи с машинами и заявками
    if method == "GET" and path.endswith("/users"):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT u.id, u.phone, u.name, u.created_at,
                    COUNT(DISTINCT b.id) as bookings_count
                FROM {SCHEMA}.users u
                LEFT JOIN {SCHEMA}.bookings b ON b.user_id = u.id
                GROUP BY u.id ORDER BY u.created_at DESC"""
        )
        users = []
        for r in cur.fetchall():
            uid = r[0]
            cur2 = conn.cursor()
            cur2.execute(
                f"SELECT brand, model, year FROM {SCHEMA}.cars WHERE user_id=%s ORDER BY id DESC", (uid,)
            )
            cars = [f"{c[0]} {c[1]}" + (f" ({c[2]})" if c[2] else "") for c in cur2.fetchall()]
            cur2.execute(
                f"""SELECT id, car_label, service, scheduled_at, comment, status, created_at
                    FROM {SCHEMA}.bookings WHERE user_id=%s ORDER BY created_at DESC""",
                (uid,),
            )
            bookings = [
                {
                    "id": b[0],
                    "car_label": b[1] or "",
                    "service": b[2] or "",
                    "scheduled_at": b[3].isoformat() if b[3] else None,
                    "comment": b[4] or "",
                    "status": b[5] or "new",
                    "created_at": b[6].isoformat() if b[6] else None,
                }
                for b in cur2.fetchall()
            ]
            cur2.close()
            users.append({
                "id": uid,
                "phone": r[1],
                "name": r[2] or "",
                "created_at": r[3].isoformat() if r[3] else None,
                "bookings_count": r[4],
                "cars": cars,
                "bookings": bookings,
            })

        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"users": users})}

    # GET /bookings — все заявки
    if method == "GET" and path.endswith("/bookings"):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT b.id, b.user_name, b.phone, b.car_label, b.service,
                    b.scheduled_at, b.comment, b.status, b.created_at, u.name
                FROM {SCHEMA}.bookings b
                LEFT JOIN {SCHEMA}.users u ON u.id = b.user_id
                ORDER BY b.created_at DESC"""
        )
        bookings = [
            {
                "id": r[0],
                "user_name": r[9] or r[1] or "",
                "phone": r[2],
                "car_label": r[3] or "",
                "service": r[4] or "",
                "scheduled_at": r[5].isoformat() if r[5] else None,
                "comment": r[6] or "",
                "status": r[7] or "new",
                "created_at": r[8].isoformat() if r[8] else None,
            }
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"bookings": bookings})}

    # POST /sms-broadcast — SMS рассылка всем пользователям
    if method == "POST" and path.endswith("/sms-broadcast"):
        message = body.get("message", "").strip()
        if not message:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите текст сообщения"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT phone FROM {SCHEMA}.users")
        phones = [r[0] for r in cur.fetchall()]
        count = len(phones)

        # Логируем все отправки
        for phone in phones:
            cur.execute(
                f"INSERT INTO {SCHEMA}.sms_log (phone, message, type) VALUES (%s, %s, 'broadcast')",
                (phone, message),
            )

        cur.execute(
            f"INSERT INTO {SCHEMA}.sms_broadcasts (message, recipients_count) VALUES (%s, %s)",
            (message, count),
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": True, "sent_to": count, "message": f"Рассылка отправлена {count} пользователям"}),
        }

    # GET /stats — статистика
    if method == "GET" and path.endswith("/stats"):
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
        users_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.bookings")
        bookings_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.sms_broadcasts")
        broadcasts_count = cur.fetchone()[0]
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"users": users_count, "bookings": bookings_count, "broadcasts": broadcasts_count}),
        }

    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
