import json
import os
import urllib.request
import psycopg2

# Псевдо-ID для команды /stock → реальный ID в БД
MERCH_MAP = {
    101: (1, 'VOID HOODIE'),
    102: (2, 'SIGNAL TEE'),
    103: (3, 'CHROME CAP'),
    104: (4, 'DISORDER PACK'),
}

ALLOWED_USERNAMES = ['flaskiy', 'fuckgenaa']

MERCH_LIST = '\n'.join([f'  /stock {code} N — {name}' for code, (_, name) in MERCH_MAP.items()])
HELP_TEXT = (
    '📦 Мерч:\n'
    + MERCH_LIST +
    '\n/stock_info — остатки\n\n'
    '🎤 Концерты:\n'
    '/events — список концертов с ID\n'
    '/event_add ДАТА ГОРОД ПЛОЩАДКА СТАТУС — добавить\n'
    '  Пример: /event_add 2026-06-01 НОВОСИБИРСК Подземка "ДОСТУПНЫ БИЛЕТЫ"\n'
    '/event_del ID — удалить концерт\n'
    '/event_blur ID — включить блюр города\n'
    '/event_unblur ID — убрать блюр города'
)


def tg_api(token: str, method: str, payload: dict):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/{method}',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req, timeout=5)


def send_message(token: str, chat_id, text: str):
    tg_api(token, 'sendMessage', {'chat_id': chat_id, 'text': text})


def db_connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    """Webhook от Telegram: заказы, мерч, управление концертами."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')

    # ── Кнопки принять/отказать ──
    callback = body.get('callback_query')
    if callback:
        callback_id = callback['id']
        data = callback.get('data', '')
        message = callback.get('message', {})
        chat_id = message.get('chat', {}).get('id')
        message_id = message.get('message_id')
        original_text = message.get('text', '')

        if data.startswith('accept_') or data.startswith('decline_'):
            action, order_id_str = data.split('_', 1)
            order_id = int(order_id_str)
            is_accept = action == 'accept'

            new_status = 'accepted' if is_accept else 'declined'
            conn = db_connect()
            cur = conn.cursor()
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
            conn.commit()
            cur.close()
            conn.close()

            status_line = '\n\n✅ ПРИНЯТ' if is_accept else '\n\n❌ ОТКАЗАНО'
            is_photo = bool(message.get('photo'))

            if is_photo:
                caption = (message.get('caption') or '') + status_line
                tg_api(token, 'editMessageCaption', {
                    'chat_id': chat_id,
                    'message_id': message_id,
                    'caption': caption,
                })
            else:
                tg_api(token, 'editMessageText', {
                    'chat_id': chat_id,
                    'message_id': message_id,
                    'text': original_text + status_line,
                })

            tg_api(token, 'answerCallbackQuery', {
                'callback_query_id': callback_id,
                'text': 'Принято ✅' if is_accept else 'Отказано ❌'
            })

        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # ── Текстовые команды ──
    message = body.get('message', {})
    if not message:
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    chat_id = message.get('chat', {}).get('id')
    from_user = message.get('from', {})
    username = (from_user.get('username') or '').lower()
    text = (message.get('text') or '').strip()

    if username not in ALLOWED_USERNAMES:
        send_message(token, chat_id, '🚫 Нет доступа')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /start или /help
    if text in ('/start', '/help'):
        send_message(token, chat_id, HELP_TEXT)
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /stock_info
    if text == '/stock_info':
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("SELECT id, name, stock_left FROM products ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        db_to_code = {db_id: code for code, (db_id, _) in MERCH_MAP.items()}
        lines = ['📦 Текущие остатки:\n']
        for row_id, name, stock_left in rows:
            code = db_to_code.get(row_id, '?')
            qty = '∞' if stock_left is None else str(stock_left)
            lines.append(f'[{code}] {name} — {qty} шт')
        send_message(token, chat_id, '\n'.join(lines))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /stock <code> <qty>
    if text.startswith('/stock '):
        parts = text.split()
        if len(parts) != 3:
            send_message(token, chat_id, '❌ Формат: /stock 101 20')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        try:
            merch_code = int(parts[1])
            qty = int(parts[2])
        except ValueError:
            send_message(token, chat_id, '❌ Код и количество должны быть числами')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        if merch_code not in MERCH_MAP:
            send_message(token, chat_id, f'❌ Неверный код. Доступные: {", ".join(str(c) for c in MERCH_MAP)}')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        if qty < 0:
            send_message(token, chat_id, '❌ Количество не может быть отрицательным')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        db_id, merch_name = MERCH_MAP[merch_code]
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("UPDATE products SET stock_left = %s WHERE id = %s", (qty, db_id))
        conn.commit()
        cur.close()
        conn.close()
        send_message(token, chat_id, f'✅ {merch_name} — остаток: {qty} шт')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /events — список концертов
    if text == '/events':
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("SELECT id, date, city, venue, status, city_blur FROM events ORDER BY sort_order, date")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        if not rows:
            send_message(token, chat_id, 'Концертов нет')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        lines = ['🎤 Концерты:\n']
        for r in rows:
            blur_mark = '🔵 блюр' if r[5] else '👁 виден'
            lines.append(f'[ID:{r[0]}] {r[1]} — {r[2]} ({r[3]}) — {r[4]} — {blur_mark}')
        send_message(token, chat_id, '\n'.join(lines))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /event_blur ID и /event_unblur ID
    if text.startswith('/event_blur ') or text.startswith('/event_unblur '):
        parts = text.split()
        if len(parts) != 2:
            send_message(token, chat_id, '❌ Формат: /event_blur 1 или /event_unblur 1')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        try:
            ev_id = int(parts[1])
        except ValueError:
            send_message(token, chat_id, '❌ ID должен быть числом')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        blur_val = text.startswith('/event_blur ')
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("UPDATE events SET city_blur = %s WHERE id = %s RETURNING city", (blur_val, ev_id))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            send_message(token, chat_id, f'❌ Концерт с ID {ev_id} не найден')
        else:
            action_word = 'включён 🔵' if blur_val else 'убран 👁'
            send_message(token, chat_id, f'✅ {row[0]} — блюр города {action_word}')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /event_del ID
    if text.startswith('/event_del '):
        parts = text.split()
        if len(parts) != 2:
            send_message(token, chat_id, '❌ Формат: /event_del 1')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        try:
            ev_id = int(parts[1])
        except ValueError:
            send_message(token, chat_id, '❌ ID должен быть числом')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        conn = db_connect()
        cur = conn.cursor()
        cur.execute("DELETE FROM events WHERE id = %s RETURNING city, date", (ev_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not row:
            send_message(token, chat_id, f'❌ Концерт с ID {ev_id} не найден')
        else:
            send_message(token, chat_id, f'🗑 Концерт удалён: {row[0]} {row[1]}')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /event_add ДАТА ГОРОД ПЛОЩАДКА СТАТУС
    if text.startswith('/event_add '):
        # Формат: /event_add 2026-06-01 НОВОСИБИРСК Подземка ДОСТУПНЫ БИЛЕТЫ
        rest = text[len('/event_add '):].strip()
        parts = rest.split(None, 3)
        if len(parts) < 3:
            send_message(token, chat_id, '❌ Формат: /event_add 2026-06-01 ГОРОД ПЛОЩАДКА СТАТУС\nСтатус необязателен')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        date_str = parts[0]
        city = parts[1].upper()
        venue = parts[2]
        status = parts[3].strip('"\'') if len(parts) > 3 else 'ДОСТУПНЫ БИЛЕТЫ'
        conn = db_connect()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO events (date, city, venue, status, city_blur, sort_order) VALUES (%s, %s, %s, %s, true, (SELECT COALESCE(MAX(sort_order),0)+1 FROM events)) RETURNING id",
            (date_str, city, venue, status)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        send_message(token, chat_id, f'✅ Концерт добавлен [ID:{new_id}]\n{date_str} — {city} ({venue}) — {status}\nГород скрыт (блюр). Убери: /event_unblur {new_id}')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    send_message(token, chat_id, HELP_TEXT)
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}