# -*- coding: utf-8 -*-
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import psycopg2
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드(
load_dotenv()

# 환경 변수에서 데이터베이스 연결 정보 가져오기
DB_USER = os.getenv("DB_USER", "Cha")  # 기본 사용자명
DB_PASSWORD = os.getenv("DB_PASSWORD", "chanju")  # 실제 비밀번호로 변경
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "speech_test")

# PostgreSQL 연결 URL 구성
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 데이터베이스 엔진 생성
engine = create_engine(DATABASE_URL)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 모델 정의를 위한 베이스 클래스
Base = declarative_base()

# 데이터베이스 세션 얻기 위한 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()