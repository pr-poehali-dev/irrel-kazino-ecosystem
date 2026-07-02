import json
import os
import hashlib
import secrets
import psycopg2

ADMIN_EMAILS = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def user_public(row) -> dict:
    return {
        'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3],
        'balance': float(row[4]), 'xp': row[5], 'level': row[6],
        'totalBets': row[7], 'totalWins': row[8],
        'totalWagered': float(row[9]), 'biggestWin': float(row[10]),
    }


def get_user_by_token(cur, token: str):
    cur.execute(
        "SELECT u.id, u.email, u.name, u.role, u.balance, u.xp, u.level, "
        "u.total_bets, u.total_wins, u.total_wagered, u.biggest_win "
        "FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''Авторизация: регистрация, вход, получение профиля по почте и паролю'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    conn = db()
    cur = conn.cursor()

    try:
        if method == 'GET' and action == 'me':
            if not token:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'no token'})}
            row = get_user_by_token(cur, token)
            if not row:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'invalid token'})}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(row)})}

        body = json.loads(event.get('body') or '{}')
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if action == 'register':
            name = (body.get('name') or 'Игрок').strip()
            if not email or len(password) < 6:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Введите почту и пароль от 6 символов'})}
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Почта уже зарегистрирована'})}
            salt = secrets.token_hex(8)
            ph = salt + ':' + hash_password(password, salt)
            role = 'admin' if email in ADMIN_EMAILS else 'user'
            cur.execute(
                "INSERT INTO users (email, name, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
                (email, name, ph, role),
            )
            uid = cur.fetchone()[0]
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (new_token, uid))
            conn.commit()
            row = get_user_by_token(cur, new_token)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': new_token, 'user': user_public(row)})}

        if action == 'login':
            cur.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
            u = cur.fetchone()
            if not u:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверная почта или пароль'})}
            salt, real = u[1].split(':')
            if hash_password(password, salt) != real:
                return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверная почта или пароль'})}
            new_token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (new_token, u[0]))
            conn.commit()
            row = get_user_by_token(cur, new_token)
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'token': new_token, 'user': user_public(row)})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
    finally:
        cur.close()
        conn.close()
