import feedparser
import pymysql
import os
from datetime import datetime
from dateutil import parser
from dotenv import load_dotenv

load_dotenv()

RSS_FEED_URL = os.environ['RSS_FEED_URL']
DB_CONFIG = {
    'host': os.environ['DB_HOST'],
    'user': os.environ['DB_USER'],
    'password': os.environ['DB_PASSWORD'],
    'database': os.environ['DB_NAME'],
    'port': int(os.environ['DB_PORT'])
}


def get_conn():
    """
    Create DB Connection
    """
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)

def is_article_exists(guid):
    """
    DB에 이미 존재하는 기사인지 확인
    """
    conn = get_conn()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS count FROM rss_news WHERE guid = %s", (guid,))
        result = cursor.fetchone()
    conn.close()
    return result["count"] > 0

def save_article(title, description, link, guid, pub_date, source, media_url):
    """
    Save Article to DB
    """
    if is_article_exists(link):
        return

    try:
        conn = get_conn()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO rss_news (title, description, link, guid, pub_date, source, media_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (title, description, link, guid, pub_date, source, media_url))
            conn.commit()
            print(f"save_article: {title}")
    except Exception as e:
        print(f"save_article: {e}")
    finally:
        conn.close()


def fetch_rss_feed():
    """
    Fetch RSS Feed From given URL
    """
    feed = feedparser.parse(RSS_FEED_URL)
    
    print(f"[*] Start RSS Feed Parse at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    for item in feed.entries:
        title = item.title
        description = item.description if "description" in item else "내용 없음"
        link = item.link
        guid = item.guid if "guid" in item else item.link
        pub_date = parser.parse(item.published) if "published" in item else datetime.now()
        source = item.dc_creator if "dc_creator" in item else "Unknown"
        media_url = item.media_content[0]["url"] if "media_content" in item else None

        # 데이터 저장
        save_article(title, description, link, guid, pub_date, source, media_url)
        # print({"title": title, "description": description, "link": link, "pub_date": pub_date, "source": source, "media_url": media_url})
    print(f"[*] End RSS Feed Parse at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    fetch_rss_feed()