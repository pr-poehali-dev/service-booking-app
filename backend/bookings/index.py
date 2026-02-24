import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1259797_service_booking_app")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Управление заявками: создание и получение заявок пользователя."""
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

    params = event.get("queryStringParameters") or {}

    # POST / — создать заявку
    if method == "POST":
        user_id = body.get("user_id")
        phone = body.get("phone", "")
        user_name = body.get("user_name", "")
        car_label = body.get("car_label", "")
        service = body.get("service", "")
        scheduled_at = body.get("scheduled_at")
        comment = body.get("comment", "")

        if not phone:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите номер телефона"})}

        conn = get_conn()
        cur = conn.cursor()

        # Обновить имя пользователя если есть
        if user_id and user_name:
            cur.execute(
                f"UPDATE {SCHEMA}.users SET name=%s WHERE id=%s AND (name IS NULL OR name='')",
                (user_name, user_id),
            )

        cur.execute(
            f"""INSERT INTO {SCHEMA}.bookings (user_id, user_name, phone, car_label, service, scheduled_at, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at""",
            (user_id, user_name, phone, car_label, service, scheduled_at, comment),
        )
        row = cur.fetchone()
        booking_id, created_at = row
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"ok": True, "booking_id": booking_id, "created_at": created_at.isoformat()}),
        }

    # GET /?user_id=X — заявки пользователя
    if method == "GET" and params.get("user_id"):
        user_id = params["user_id"]
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, car_label, service, scheduled_at, comment, status, created_at
                FROM {SCHEMA}.bookings WHERE user_id=%s ORDER BY created_at DESC""",
            (user_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        bookings = [
            {
                "id": r[0],
                "car_label": r[1] or "",
                "service": r[2] or "",
                "scheduled_at": r[3].isoformat() if r[3] else None,
                "comment": r[4] or "",
                "status": r[5] or "new",
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"bookings": bookings})}

    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
