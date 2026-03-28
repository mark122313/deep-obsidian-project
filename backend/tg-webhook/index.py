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
    '📦 Управление остатками\n\n'
    + MERCH_LIST +
    '\n\nПример: /stock 101 20 — установит 20 шт для VOID HOODIE\n\n'
    '/stock_info — текущие остатки'
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


def handler(event: dict, context) -> dict:
    """Webhook от Telegram: кнопки Принять/Отказать + команда /stock для пополнения мерча."""
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
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            cur.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
            conn.commit()
            cur.close()
            conn.close()

            status_line = '\n\n✅ ПРИНЯТ' if is_accept else '\n\n❌ ОТКАЗАНО'
            is_photo = bool(message.get('photo'))

            if is_photo:
                # Сообщение с фото — редактируем подпись
                caption = (message.get('caption') or '') + status_line
                tg_api(token, 'editMessageCaption', {
                    'chat_id': chat_id,
                    'message_id': message_id,
                    'caption': caption,
                })
            else:
                # Текстовое сообщение — редактируем текст
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

    # Проверка доступа
    if username != ALLOWED_USERNAME:
        send_message(token, chat_id, '🚫 Нет доступа')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /start или /help
    if text in ('/start', '/help'):
        send_message(token, chat_id, HELP_TEXT)
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /stock_info — текущие остатки
    if text == '/stock_info':
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("SELECT id, name, stock_left FROM products ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        # Обратный маппинг: db_id → code
        db_to_code = {db_id: code for code, (db_id, _) in MERCH_MAP.items()}
        lines = ['📦 Текущие остатки:\n']
        for row_id, name, stock_left in rows:
            code = db_to_code.get(row_id, '?')
            qty = '∞' if stock_left is None else str(stock_left)
            lines.append(f'[{code}] {name} — {qty} шт')
        send_message(token, chat_id, '\n'.join(lines))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    # /stock <code> <qty>
    if text.startswith('/stock'):
        parts = text.split()
        if len(parts) != 3:
            send_message(token, chat_id, '❌ Формат: /stock 101 20\n\n' + HELP_TEXT)
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        try:
            merch_code = int(parts[1])
            qty = int(parts[2])
        except ValueError:
            send_message(token, chat_id, '❌ Код товара и количество должны быть числами')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        if merch_code not in MERCH_MAP:
            codes = ', '.join(str(c) for c in MERCH_MAP)
            send_message(token, chat_id, f'❌ Неверный код. Доступные коды: {codes}')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        if qty < 0:
            send_message(token, chat_id, '❌ Количество не может быть отрицательным')
            return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

        db_id, merch_name = MERCH_MAP[merch_code]
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("UPDATE products SET stock_left = %s WHERE id = %s", (qty, db_id))
        conn.commit()
        cur.close()
        conn.close()

        send_message(token, chat_id, f'✅ {merch_name} — остаток обновлён: {qty} шт')
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    send_message(token, chat_id, HELP_TEXT)
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}