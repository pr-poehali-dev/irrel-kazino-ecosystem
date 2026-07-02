import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def user_public(row) -> dict:
    return {
        'id': row[0], 'email': row[1], 'name': row[2], 'role': row[3],
        'balance': float(row[4]), 'xp': row[5], 'level': row[6],
        'totalBets': row[7], 'totalWins': row[8],
        'totalWagered': float(row[9]), 'biggestWin': float(row[10]),
    }


SELECT_USER = (
    "SELECT id, email, name, role, balance, xp, level, "
    "total_bets, total_wins, total_wagered, biggest_win FROM users WHERE id = %s"
)


def auth_user(cur, token):
    cur.execute("SELECT user_id FROM sessions WHERE token = %s", (token,))
    r = cur.fetchone()
    return r[0] if r else None


def xp_for_level(level: int) -> int:
    return level * 500


def handler(event: dict, context) -> dict:
    '''Игровая логика: применение результата ставки, рейтинг, админ-начисление'''
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
        if action == 'leaderboard':
            cur.execute(
                "SELECT name, total_wagered FROM users ORDER BY total_wagered DESC LIMIT 20"
            )
            board = [{'name': n, 'score': float(s)} for n, s in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'board': board})}

        uid = auth_user(cur, token) if token else None
        if not uid:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'unauthorized'})}

        body = json.loads(event.get('body') or '{}')

        if action == 'bet':
            bet = float(body.get('bet', 0))
            payout = float(body.get('payout', 0))
            cur.execute(SELECT_USER, (uid,))
            u = cur.fetchone()
            balance = float(u[4])
            if bet > balance:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Недостаточно средств'})}
            win = 1 if payout > 0 else 0
            new_balance = balance + payout - bet
            xp = u[5] + max(1, round(bet / 10))
            level = u[6]
            while xp >= xp_for_level(level):
                xp -= xp_for_level(level)
                level += 1
            biggest = max(float(u[10]), payout)
            cur.execute(
                "UPDATE users SET balance=%s, xp=%s, level=%s, total_bets=total_bets+1, "
                "total_wins=total_wins+%s, total_wagered=total_wagered+%s, biggest_win=%s WHERE id=%s",
                (new_balance, xp, level, win, bet, biggest, uid),
            )
            conn.commit()
            cur.execute(SELECT_USER, (uid,))
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(cur.fetchone())})}

        if action == 'purchase':
            amount = float(body.get('amount', 0))
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (amount, uid))
            conn.commit()
            cur.execute(SELECT_USER, (uid,))
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(cur.fetchone())})}

        if action == 'claim':
            amount = float(body.get('amount', 0))
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (amount, uid))
            conn.commit()
            cur.execute(SELECT_USER, (uid,))
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_public(cur.fetchone())})}

        cur.execute("SELECT role FROM users WHERE id = %s", (uid,))
        role = cur.fetchone()[0]

        if action == 'admin_users':
            if role != 'admin':
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'forbidden'})}
            cur.execute(
                "SELECT id, email, name, role, balance, total_bets FROM users ORDER BY id"
            )
            users = [
                {'id': r[0], 'email': r[1], 'name': r[2], 'role': r[3], 'balance': float(r[4]), 'totalBets': r[5]}
                for r in cur.fetchall()
            ]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'users': users})}

        if action == 'admin_grant':
            if role != 'admin':
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'forbidden'})}
            target = int(body.get('userId'))
            amount = float(body.get('amount', 0))
            cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (amount, target))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'admin_role':
            if role != 'admin':
                return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'forbidden'})}
            target = int(body.get('userId'))
            new_role = body.get('role')
            if new_role not in ('user', 'admin'):
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'bad role'})}
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, target))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
    finally:
        cur.close()
        conn.close()
