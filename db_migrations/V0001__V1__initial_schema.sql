
CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.cars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p1259797_service_booking_app.users(id),
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year VARCHAR(4),
    last_oil_change VARCHAR(20),
    next_oil_change VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p1259797_service_booking_app.users(id),
    user_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    car_id INTEGER REFERENCES t_p1259797_service_booking_app.cars(id),
    car_label VARCHAR(100),
    service VARCHAR(200),
    scheduled_at TIMESTAMP,
    comment TEXT,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.otp_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.sms_log (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20),
    message TEXT,
    type VARCHAR(20) DEFAULT 'otp',
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p1259797_service_booking_app.sms_broadcasts (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    sent_by VARCHAR(50) DEFAULT 'admin',
    recipients_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT NOW()
);
