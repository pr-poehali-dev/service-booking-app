import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p1259797_service_booking_app")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Профиль пользователя: данные, машины, история заявок."""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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

    # GET /?user_id=X — профиль и заявки
    if method == "GET" and params.get("user_id"):
        user_id = params["user_id"]
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id, phone, name, created_at FROM {SCHEMA}.users WHERE id=%s", (user_id,))
        user_row = cur.fetchone()
        if not user_row:
            cur.close()
            conn.close()
            return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Пользователь не найден"})}

        user = {"id": user_row[0], "phone": user_row[1], "name": user_row[2] or "", "created_at": user_row[3].isoformat()}

        cur.execute(
            f"SELECT id, brand, model, year, last_oil_change, next_oil_change FROM {SCHEMA}.cars WHERE user_id=%s ORDER BY id",
            (user_id,),
        )
        cars = [
            {"id": r[0], "brand": r[1], "model": r[2], "year": r[3] or "", "last_oil_change": r[4] or "", "next_oil_change": r[5] or ""}
            for r in cur.fetchall()
        ]

        cur.execute(
            f"""SELECT id, car_label, service, scheduled_at, comment, status, created_at
                FROM {SCHEMA}.bookings WHERE user_id=%s ORDER BY created_at DESC""",
            (user_id,),
        )
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
            for r in cur.fetchall()
        ]

        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"user": user, "cars": cars, "bookings": bookings})}

    # PUT /name — обновить имя
    if method == "PUT" and path.endswith("/name"):
        user_id = body.get("user_id")
        name = body.get("name", "").strip()
        if not user_id or not name:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите user_id и имя"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.users SET name=%s WHERE id=%s", (name, user_id))
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    # POST /cars — добавить машину
    if method == "POST" and path.endswith("/cars"):
        user_id = body.get("user_id")
        brand = body.get("brand", "")
        model = body.get("model", "")
        year = body.get("year", "")
        last_oil = body.get("last_oil_change", "")
        next_oil = body.get("next_oil_change", "")
        if not user_id or not brand or not model:
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "Укажите user_id, марку и модель"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.cars (user_id, brand, model, year, last_oil_change, next_oil_change) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
            (user_id, brand, model, year, last_oil, next_oil),
        )
        car_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True, "car_id": car_id})}

    return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Not found"})}
