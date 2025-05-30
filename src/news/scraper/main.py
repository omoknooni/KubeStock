import feedparser
import pymysql
import os
import time
from datetime import datetime
from dateutil import parser
from dotenv import load_dotenv
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup

load_dotenv()

# --- 환경 변수 로드 및 설정 ---
RSS_FEED_URL = os.environ.get('RSS_FEED_URL')
KO_RSS_FEED_URL = os.environ.get('KO_RSS_FEED_URL')
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

# 필수 환경 변수 확인
if not all([KO_RSS_FEED_URL, RSS_FEED_URL, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    print("[ERROR] Required environment variables are missing.")
    exit(1) # 필수 변수 없으면 종료

LANG = {
    "ko": KO_RSS_FEED_URL,
    "en": RSS_FEED_URL
}

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

def truncate_string(text: str, max_length: int) -> str:
    """
    주어진 문자열이 최대 길이를 초과하면 잘라내고 '...'을 붙입니다.

    Args:
        text (str): 처리할 문자열.
        max_length (int): 최대 허용 길이 (말줄임표 포함).

    Returns:
        str: 처리된 문자열.
    """
    if not isinstance(text, str): # 입력값이 문자열이 아닌 경우 처리
        text = str(text)

    if len(text) > max_length:
        # max_length가 5보다 작으면 말줄임표를 붙일 수 없으므로 그냥 자르기만 함
        if max_length < 5:
             # 음수 인덱싱 방지
             return text[:max(0, max_length)]
        # 말줄임표 길이(5)를 제외한 길이만큼 자르고 '...' 추가
        # max_length - 5이 음수가 되지 않도록 max(0, ...) 사용
        return text[:max(0, max_length - 5)] + "..."
    else:
        # 길이가 제한 이내이면 원본 문자열 반환
        return text

def is_article_exists(conn: pymysql.connections.Connection, lang: str, guid: str) -> bool:
    """
    DB에 이미 존재하는 기사인지 확인 (주어진 연결 사용)
    """
    if not conn:
        print("[Error] is_article_exists: Invalid database connection provided.")
        return False # 또는 예외 발생 고려

    try:
        if lang == "en":
            table_name = "rss_news"
        elif lang == "ko":
            table_name = "rss_news_ko"
        else:
            print(f"[Error] is_article_exists: Unsupported language '{lang}'")
            return False
        
        with conn.cursor() as cursor:
            sql = f"SELECT COUNT(*) AS count FROM `{table_name}` WHERE guid = %s"
            cursor.execute(sql, (guid,))
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

def save_article(conn: pymysql.connections.Connection, lang: str, title: str, description: str, link: str, guid: str, pub_date: datetime, source: str, media_url: Optional[str]):
    """
    기사를 DB에 저장 (주어진 연결 사용)
    """
    if not conn:
        print("[Error] save_article: Invalid database connection provided.")
        return

    try:
        with conn.cursor() as cursor:
            if lang == "en":
                sql = """
                    INSERT INTO rss_news (title, description, link, guid, pub_date, source, media_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
            elif lang == "ko":
                sql = """
                    INSERT INTO rss_news_ko (title, description, link, guid, pub_date, source, media_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
            else:
                print(f"[Error] save_article: Unsupported language '{lang}'")
                return
            # pub_date를 MySQL DATETIME 형식 문자열로 변환 (필요시)
            pub_date_str = pub_date.strftime('%Y-%m-%d %H:%M:%S')
            cursor.execute(sql, (title, description, link, guid, pub_date_str, source, media_url))
            # commit은 fetch_rss_feed 끝에서 한 번만 수행하거나, 여기서 각 건마다 수행할 수 있음
            # conn.commit() # 각 건마다 커밋하려면 여기서 호출
            print(f"[DB_SAVE] Saved article: {title}")
    except pymysql.MySQLError as e:
        print(f"[DB_ERROR] save_article - MySQL error for article '{title[:30]}...': {e}")
    except Exception as e:
        print(f"[Error] save_article - Unexpected error for article '{title[:30]}...': {e}")


def fetch_rss_feed(lang):
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
        feed = feedparser.parse(LANG[lang])

        if feed.bozo:
            # 피드 파싱 오류 처리
            bozo_exception = feed.get('bozo_exception', 'Unknown error')
            print(f"[RSS_ERROR] Failed to parse RSS feed: {bozo_exception}")
            return

        if not feed.entries:
            print("[INFO] No entries found in the RSS feed.")
            return

        saved_count = 0
        skipped_count = 0
        for item in feed.entries:
            try:
                # 주요 속성 추출
                title = item.get('title', 'No Title Provided')
                title = truncate_string(title, 255)
                link = item.get('link', 'No Link Provided')

                # description 추출 및 HTML 태그 제거
                description_html = item.get('description', 'No Description')
                cleaned_description = 'No Description' # 기본값

                if description_html and description_html != 'No Description':
                    try:
                        # BeautifulSoup 객체 생성 (기본 html.parser 사용)
                        soup = BeautifulSoup(description_html, 'html.parser')
                        # get_text()로 모든 텍스트 추출, separator=' '는 태그 사이를 공백으로 만듦
                        cleaned_description = soup.get_text(separator=' ').strip()
                        # 여러 공백 문자(줄바꿈, 탭 포함)를 단일 공백으로 대체
                        cleaned_description = ' '.join(cleaned_description.split())
                    except Exception as html_parse_error:
                        # HTML 파싱 중 오류 발생 시 경고 출력 및 원본 사용 고려
                        print(f"[WARN] Could not clean HTML from description for entry '{title[:30]}...': {html_parse_error}")
                        cleaned_description = description_html # 파싱 실패 시 원본 HTML을 그대로 둘 수도 있음

                # guid가 없으면 link를 사용, 둘 다 중요하므로 누락 시 경고
                original_guid = item.get("guid")
                if not original_guid and link == "No Link Provided":
                    print(f"[WARN] Article skipped: Missing both guid and link for title '{title[:30]}...'")
                    skipped_count += 1
                    continue

                guid_raw = original_guid if original_guid else link
                guid = truncate_string(guid_raw, 255)
                
                # 기사 게재일자 추출
                pub_date_str = item.get("published")
                pub_date = parser.parse(pub_date_str) if pub_date_str else datetime.now()

                # 기사 원본 정보 추출
                source = item.get('author', item.get('dc_creator', item.get('creator', 'Unknown Author'))) # author 필드도 확인
                source = truncate_string(source, 100)

                # 기사 대표 이미지 URL 추출
                media_url = None
                if "media_content" in item and item.media_content and isinstance(item.media_content, list):
                    # media_content가 리스트일 수 있으므로 첫 번째 요소 확인
                    media_url = item.media_content[0].get("url")

                # 데이터 저장 전 중복 확인
                if is_article_exists(conn, lang, guid):
                    # print(f"[INFO] Article already exists, skipping: {title}")
                    skipped_count += 1
                    continue

                # 데이터 저장
                save_article(conn, lang, title, cleaned_description, link, guid, pub_date, source, media_url)
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
        for feed in ["ko", "en"]:
            print(f"[*] RSS Feed {feed} : {LANG[feed]}")
            fetch_rss_feed(feed)
            print("[INFO] RSS Feed Fetching Process Completed.")
            time.sleep(2)
        exit(0) # 정상 종료
    except Exception as e:
        print(f"[CRITICAL_ERROR] An unhandled error occurred in the main process: {e}")
        exit(1) # 비정상 종료