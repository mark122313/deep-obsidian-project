import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """Возвращает список концертов для отображения на сайте."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute("""
        SELECT id, date, city, venue, status, city_blur
        FROM events
        ORDER BY sort_order, date
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    events = []
    for row in rows:
        events.append({
            'id': row[0],
            'date': row[1].isoformat(),
            'city': row[2],
            'venue': row[3],
            'status': row[4],
            'city_blur': row[5],
        })

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'events': events})
    }
