import json
import os
import urllib.request
import psycopg2


def tg_api(token: str, method: str, payload: dict):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/{method}',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req, timeout=5)


def handler(event: dict, context) -> dict:
    """Webhook от Telegram: обрабатывает нажатия кнопок Принять/Отказать на заказах."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    callback = body.get('callback_query')
    if not callback:
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
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

        # Обновляем статус в БД
        new_status = 'accepted' if is_accept else 'declined'
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
        conn.commit()
        cur.close()
        conn.close()

        # Редактируем сообщение — убираем кнопки, добавляем статус
        status_line = '\n\n✅ <b>ПРИНЯТ</b>' if is_accept else '\n\n❌ <b>ОТКАЗАНО</b>'
        tg_api(token, 'editMessageText', {
            'chat_id': chat_id,
            'message_id': message_id,
            'text': original_text + status_line,
            'parse_mode': 'HTML'
        })

        # Отвечаем на callback (убирает "часики" на кнопке)
        tg_api(token, 'answerCallbackQuery', {
            'callback_query_id': callback_id,
            'text': 'Принято ✅' if is_accept else 'Отказано ❌'
        })

    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': 'ok'}
