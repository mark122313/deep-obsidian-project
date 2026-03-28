import json
import os
import psycopg2
import urllib.request

def handler(event: dict, context) -> dict:
    """Оформление заказа: создаёт заказ из корзины, списывает остатки."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'method not allowed'})}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id')
    if not session_id:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'session_id required'})}

    body = json.loads(event.get('body') or '{}')
    name = body.get('name', '').strip()
    email = body.get('email', '').strip()
    phone = body.get('phone', '').strip()
    address = body.get('address', '').strip()
    comment = body.get('comment', '').strip()

    if not name or not email:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'name and email required'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("""
        SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock_left, p.image_url
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.session_id = %s
    """, (session_id,))
    cart = cur.fetchall()

    if not cart:
        cur.close(); conn.close()
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'cart is empty'})}

    for item in cart:
        stock_left = item[4]
        if stock_left is not None and item[1] > stock_left:
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': f'not enough stock for {item[2]}', 'stock_left': stock_left})}

    total = sum(item[1] * item[3] for item in cart)

    cur.execute("""
        INSERT INTO orders (session_id, name, email, phone, address, comment, total)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (session_id, name, email, phone, address, comment, total))
    order_id = cur.fetchone()[0]

    for item in cart:
        product_id, quantity, pname, price, stock_left, image_url = item
        cur.execute("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                    (order_id, product_id, quantity, price))
        if stock_left is not None:
            cur.execute("UPDATE products SET stock_left = stock_left - %s WHERE id = %s", (quantity, product_id))

    cur.execute("DELETE FROM cart_items WHERE session_id = %s", (session_id,))
    conn.commit()
    cur.close(); conn.close()

    # Отправка уведомления в Telegram
    try:
        tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        tg_chat = '-5236633853'
        if tg_token:
            lines = [f'🛒 <b>Новый заказ #{order_id}</b>']
            lines.append(f'👤 {name}')
            if email: lines.append(f'📧 {email}')
            if phone: lines.append(f'📞 {phone}')
            if address: lines.append(f'📍 {address}')
            lines.append('')
            for item in cart:
                _, qty, pname, price, _, _ = item
                lines.append(f'• {pname} × {qty} — {qty * price:,.0f} ₽'.replace(',', ' '))
            lines.append('')
            lines.append(f'💰 <b>Итого: {total:,.0f} ₽</b>'.replace(',', ' '))
            if comment: lines.append(f'💬 {comment}')
            text = '\n'.join(lines)
            reply_markup = {
                'inline_keyboard': [[
                    {'text': '✅ Принять', 'callback_data': f'accept_{order_id}'},
                    {'text': '❌ Отказать', 'callback_data': f'decline_{order_id}'}
                ]]
            }

            # Берём фото первого товара с изображением
            photo_url = next((item[5] for item in cart if item[5]), None)

            if photo_url:
                tg_payload = json.dumps({
                    'chat_id': tg_chat,
                    'photo': photo_url,
                    'caption': text,
                    'parse_mode': 'HTML',
                    'reply_markup': reply_markup
                }).encode()
                tg_method = 'sendPhoto'
            else:
                tg_payload = json.dumps({
                    'chat_id': tg_chat,
                    'text': text,
                    'parse_mode': 'HTML',
                    'reply_markup': reply_markup
                }).encode()
                tg_method = 'sendMessage'

            req = urllib.request.Request(
                f'https://api.telegram.org/bot{tg_token}/{tg_method}',
                data=tg_payload,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True, 'order_id': order_id, 'total': total})
    }