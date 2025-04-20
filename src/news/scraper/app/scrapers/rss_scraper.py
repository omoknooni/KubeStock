import feedparser
import pymysql
import os
from datetime import datetime
from dateutil import parser
from dotenv import load_dotenv
from typing import Optional, Dict, Any

load_dotenv()

# --- 환경 변수 로드 및 설정 ---
RSS_FEED_URL = os.environ.get('RSS_FEED_URL')
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

# 필수 환경 변수 확인
if not all([RSS_FEED_URL, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    print("[ERROR] Required environment variables are missing.")
    exit(1) # 필수 변수 없으면 종료

DB_CONFIG: Dict[str, Any] = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME,
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def check_db_connection() -> bool:
    """
    데이터베이스 연결 가능 여부를 확인합니다.
    연결 테스트 후 즉시 연결을 닫습니다.
    """
    print("[INFO] Checking database connectivity...")
    conn = None
    try:
        # 설정값이 올바른지, 네트워크 연결이 가능한지 등 테스트
        conn = pymysql.connect(**DB_CONFIG)
        print("[SUCCESS] Database connection test successful.")
        return True
    except pymysql.MySQLError as e:
        print(f"[DB_CONN_FAIL] MySQL connection test failed: {e}")
        return False
    except Exception as e:
        print(f"[DB_CONN_FAIL] An unexpected error occurred during connection test: {e}")
        return False
    finally:
        if conn:
            conn.close()
            print("[INFO] Test database connection closed.")

def get_db_connection() -> Optional[pymysql.connections.Connection]:
    """
    데이터베이스 연결을 생성하고 반환
    연결 실패 시 None을 반환
    """
    try:
        conn = pymysql.connect(**DB_CONFIG)
        print("[INFO] Database connection successful.")
        return conn
    except pymysql.MySQLError as e:
        print(f"[DB_CONN_ERROR] MySQL error during connection: {e}")
        return None
    except Exception as e:
        print(f"[DB_CONN_ERROR] An unexpected error occurred during connection: {e}")
        return None

def is_article_exists(conn: pymysql.connections.Connection, guid: str) -> bool:
    """
    DB에 이미 존재하는 기사인지 확인 (주어진 연결 사용)
    """
    if not conn:
        print("[Error] is_article_exists: Invalid database connection provided.")
        return False # 또는 예외 발생 고려

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS count FROM rss_news WHERE guid = %s", (guid,))
            result = cursor.fetchone()
        # 결과가 None이 아니고 'count' 키가 있는지 확인
        return result and result.get("count", 0) > 0
    except pymysql.MySQLError as e:
        print(f"[DB_ERROR] is_article_exists - MySQL error: {e}")
        # 연결 문제 발생 시, 연결을 다시 시도하거나 상위에서 처리하도록 예외를 던질 수 있음
        # 여기서는 False를 반환하여 해당 기사 저장을 스킵하도록 함
        return False
    except Exception as e:
        print(f"[Error] is_article_exists - Unexpected error: {e}")
        return False

def save_article(conn: pymysql.connections.Connection, title: str, description: str, link: str, guid: str, pub_date: datetime, source: str, media_url: Optional[str]):
    """
    기사를 DB에 저장 (주어진 연결 사용)
    """
    if not conn:
        print("[Error] save_article: Invalid database connection provided.")
        return

    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO rss_news (title, description, link, guid, pub_date, source, media_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            # pub_date를 MySQL DATETIME 형식 문자열로 변환 (필요시)
            pub_date_str = pub_date.strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(sql, (title, description, link, guid, pub_date_str, source, media_url))
            # commit은 fetch_rss_feed 끝에서 한 번만 수행하거나, 여기서 각 건마다 수행할 수 있음
            # conn.commit() # 각 건마다 커밋하려면 여기서 호출
            print(f"[DB_SAVE] Saved article: {title}")
    except pymysql.MySQLError as e:
        print(f"[DB_ERROR] save_article - MySQL error: {e}")
        # 필요시 롤백 처리
        try:
            conn.rollback()
            print("[DB_ROLLBACK] Transaction rolled back.")
        except Exception as re:
            print(f"[Error] Failed to rollback transaction: {re}")
    except Exception as e:
        print(f"[Error] save_article - Unexpected error: {e}")


def fetch_rss_feed():
    """
    주어진 URL에서 RSS 피드를 가져와 파싱하고 DB에 저장
    """
    conn = None # 연결 변수 초기화
    try:
        # 실제 데이터 처리를 위한 DB 연결 얻기
        conn = get_db_connection()
        if conn is None:
            print("[ERROR] Failed to establish database connection for processing. Aborting.")
            return # 연결 실패 시 함수 종료

        print(f"[*] Start RSS Feed Parse at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        feed = feedparser.parse(RSS_FEED_URL)

        if feed.bozo:
            # 피드 파싱 오류 처리
            bozo_exception = feed.get('bozo_exception', 'Unknown error')
            print(f"[RSS_ERROR] Failed to parse RSS feed: {bozo_exception}")
            return

        saved_count = 0
        skipped_count = 0
        for item in feed.entries:
            try:
                title = item.title
                description = item.description if "description" in item else "내용 없음"
                link = item.link
                # guid가 없으면 link를 사용, 둘 다 중요하므로 누락 시 경고
                guid = item.get("guid", item.get("link"))
                if not guid:
                    print(f"[WARN] Article skipped: Missing both guid and link for title '{title[:30]}...'")
                    skipped_count += 1
                    continue

                pub_date_str = item.get("published")
                pub_date = parser.parse(pub_date_str) if pub_date_str else datetime.now()

                source = item.get("dc_creator", item.get("author", "Unknown")) # author 필드도 확인
                media_url = None
                if "media_content" in item and item.media_content:
                    # media_content가 리스트일 수 있으므로 첫 번째 요소 확인
                    media_url = item.media_content[0].get("url")

                # 데이터 저장 전 중복 확인
                if is_article_exists(conn, guid):
                    # print(f"[INFO] Article already exists, skipping: {title}")
                    skipped_count += 1
                    continue

                # 데이터 저장
                save_article(conn, title, description, link, guid, pub_date, source, media_url)
                saved_count += 1

            except Exception as e:
                # 개별 아이템 처리 중 예외 발생 시 로깅하고 계속 진행
                print(f"[RSS_ITEM_ERROR] Failed to process article '{item.get('title', 'N/A')}': {e}")
                skipped_count += 1
                continue # 다음 아이템으로 넘어감

        # 모든 아이템 처리 후 한 번에 커밋 (효율적)
        if conn and saved_count > 0: # 저장한 내용이 있을 때만 커밋
            try:
                conn.commit()
                print("[DB_COMMIT] All changes committed successfully.")
            except pymysql.MySQLError as e:
                print(f"[DB_ERROR] Failed to commit changes: {e}")
                # 롤백 시도
                try:
                    conn.rollback()
                    print("[DB_ROLLBACK] Transaction rolled back due to commit failure.")
                except Exception as re:
                    print(f"[Error] Failed to rollback transaction after commit failure: {re}")

        print(f"[*] End RSS Feed Parse at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"[*] Summary: Saved={saved_count}, Skipped={skipped_count}")

    except feedparser.CharacterEncodingOverride as e:
        print(f"[RSS_ERROR] Feed character encoding issue: {e}")
    except Exception as e:
        # RSS 피드 가져오기/파싱 또는 DB 작업 중 예기치 않은 오류
        print(f"[FATAL_ERROR] An error occurred during RSS feed processing: {e}")
        # 롤백 시도 (만약 연결이 유효하고 트랜잭션 중이었다면)
        if conn:
            try:
                conn.rollback()
                print("[DB_ROLLBACK] Transaction rolled back due to fatal error.")
            except Exception as re:
                print(f"[Error] Failed to rollback transaction after fatal error: {re}")
    finally:
        # 모든 작업 완료 후 DB 연결 닫기
        if conn:
            conn.close()
            print("[INFO] Main database connection closed.")


if __name__ == "__main__":
    # 1. DB 연결성 우선 검사
    if not check_db_connection():
        print("[EXIT] Halting script due to database connection failure.")
        exit(1) # exit 1 -> Error로 처리

    # 2. DB 연결 확인 후 RSS 피드 처리 시도
    try:
        fetch_rss_feed()
        print("[INFO] RSS Feed Fetching Process Completed.")
        exit(0) # 정상 종료
    except Exception as e:
        print(f"[CRITICAL_ERROR] An unhandled error occurred in the main process: {e}")
        exit(1) # 비정상 종료