import logging
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()
logger = logging.getLogger("learnai.database")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_TYPE = os.getenv("DB_TYPE", "").strip().lower()

HOST = os.getenv("DB_HOST", "127.0.0.1")
PORT = int(os.getenv("DB_PORT", "3306"))
USER = os.getenv("DB_USER", "root")
PASSWORD = os.getenv("DB_PASSWORD", "")
NAME = os.getenv("DB_NAME", "learnai_path")

Base = declarative_base()


def _sqlite_url() -> str:
    # On Vercel / AWS Lambda, local filesystem is read-only except /tmp
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/learnai.db"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(base_dir, "learnai.db")
    return f"sqlite:///{db_file}"


def _init_engine():
    # 1. Direct DATABASE_URL (for cloud hosting like Render/Railway/Supabase/PostgreSQL/MySQL)
    if DATABASE_URL:
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        if url.startswith("sqlite"):
            return create_engine(url, connect_args={"check_same_thread": False})
        return create_engine(url, pool_pre_ping=True)

    # 2. SQLite explicitly requested or running in serverless environment without external DB
    if DB_TYPE == "sqlite" or os.getenv("USE_SQLITE", "").lower() in ("true", "1", "yes") or os.getenv("VERCEL"):
        return create_engine(_sqlite_url(), connect_args={"check_same_thread": False})

    # 3. Default MySQL with fallback
    try:
        import pymysql
        # Attempt to create database if it doesn't exist
        try:
            conn = pymysql.connect(host=HOST, port=PORT, user=USER, password=PASSWORD, connect_timeout=3)
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        f"CREATE DATABASE IF NOT EXISTS `{NAME}` "
                        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                    )
                conn.commit()
            finally:
                conn.close()
        except Exception as err:
            logger.warning(f"Could not verify/create MySQL database '{NAME}': {err}")

        mysql_url = f"mysql+pymysql://{USER}:{quote_plus(PASSWORD)}@{HOST}:{PORT}/{NAME}?charset=utf8mb4"
        eng = create_engine(mysql_url, pool_pre_ping=True)
        # Verify connection works
        with eng.connect():
            pass
        return eng
    except Exception as e:
        logger.warning(f"MySQL unavailable ({e}). Falling back to local SQLite database ({_sqlite_url()}).")
        return create_engine(_sqlite_url(), connect_args={"check_same_thread": False})


engine = _init_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
