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

ALLOWED_USERNAME = 'flaskiy'

MERCH_LIST = '\n'.join([f'  /stock {code} N — {name}' for code, (_, name) in MERCH_MAP.items()])
HELP_TEXT = (
    '📦 Мерч:\n'
    + MERCH_LIST +
    '\n/stock_info — остатки\n'
    '/coming_soon — управление товарами "скоро будет"\n\n'
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

    if username != ALLOWED_USERNAME:
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
        cur.execute("SELECT id, name, stock_left, coming_soon FROM products ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        db_to_code = {db_id: code for code, (db_id, _) in MERCH_MAP.items()}
        lines = ['📦 Текущие остатки:\n']
        for row_id, name, stock_left, coming_soon in rows:
            if coming_soon:
                lines.append(f'[{db_to_code.get(row_id, "?")}] {name} — ⏳ СКОРО БУДЕТ')
            else:
                qty = '∞' if stock_left is None else str(stock_left)
                lines.append(f'[{db_to_code.get(row_id, "?")}] {name} — {qty} шт')
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
        # Снимаем флаг coming_soon, если устанавливаем количество
        cur.execute("UPDATE products SET stock_left = %s, coming_soon = false WHERE id = %s", (qty, db_id))
        conn.commit()
        cur.close()
        conn.close()
        send_message(token, chat_id, f'✅ {merch_name} — остаток: {qty} шт (товар доступен для продажи)')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # ─── НОВАЯ КОМАНДА: УПРАВЛЕНИЕ "СКОРО БУДЕТ" ───
    if text.startswith('/coming_soon'):
        parts = text.split()
        
        # /coming_soon list — список товаров со статусом
        if len(parts) == 2 and parts[1] == 'list':
            conn = db_connect()
            cur = conn.cursor()
            cur.execute("SELECT id, name, coming_soon, release_date FROM products ORDER BY id")
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            db_to_code = {db_id: code for code, (db_id, _) in MERCH_MAP.items()}
            lines = ['⏳ Товары "Скоро будет":\n']
            for row_id, name, coming_soon, release_date in rows:
                code = db_to_code.get(row_id, '?')
                status = '🔮 СКОРО' if coming_soon else '✅ В ПРОДАЖЕ'
                date_str = f' — {release_date}' if release_date else ''
                lines.append(f'[{code}] {name}: {status}{date_str}')
            send_message(token, chat_id, '\n'.join(lines))
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        
        # /coming_soon enable <code> [дата] — включить режим "скоро будет"
        if len(parts) >= 3 and parts[1] == 'enable':
            try:
                merch_code = int(parts[2])
            except ValueError:
                send_message(token, chat_id, '❌ Код товара должен быть числом')
                return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
            
            if merch_code not in MERCH_MAP:
                send_message(token, chat_id, f'❌ Неверный код. Доступные: {", ".join(str(c) for c in MERCH_MAP)}')
                return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
            
            release_date = None
            if len(parts) >= 4:
                release_date = parts[3]
            
            db_id, merch_name = MERCH_MAP[merch_code]
            conn = db_connect()
            cur = conn.cursor()
            if release_date:
                cur.execute("UPDATE products SET coming_soon = true, release_date = %s, stock_left = NULL WHERE id = %s", (release_date, db_id))
                send_message(token, chat_id, f'✅ {merch_name} — включён режим "СКОРО БУДЕТ" (релиз: {release_date})')
            else:
                cur.execute("UPDATE products SET coming_soon = true, release_date = NULL, stock_left = NULL WHERE id = %s", (db_id,))
                send_message(token, chat_id, f'✅ {merch_name} — включён режим "СКОРО БУДЕТ"')
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
        
        # /coming_soon disable <code> — выключить режим "скоро будет" (товар становится доступным)
        if len(parts) == 3 and parts[1] == 'disable':
            try:
                merch_code = int(parts[2])
            except ValueError:
                send_message(token, chat_id, '❌ Код товара должен быть числом