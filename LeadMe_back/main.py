# -*- coding: utf-8 -*-
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# 내부 모듈 임포트
from database import get_db, engine
import models
from app.api import users, speech_sessions, word_list, speed_analysis, speech_recognition, auth

# 기본 디렉토리 생성
os.makedirs("uploads/audio", exist_ok=True)
os.makedirs("uploads/images", exist_ok=True)

app = FastAPI(
    title="음성 치료 애플리케이션 API",
    description="음성 치료를 위한 백엔드 API 서비스",
    version="0.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 환경에서는 구체적인 오리진을 지정해야 함
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 설정
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static", StaticFiles(directory="static"), name="static")


# 루트 라우트
@app.get("/")
def read_root():
    return {"message": "음성 치료 애플리케이션 API에 오신 것을 환영합니다!"}


# 상태 체크 엔드포인트
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# API 라우터 설정
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(speech_sessions.router, prefix="/api/speech", tags=["speech"])
app.include_router(word_list.router, prefix="/api/words", tags=["words"])
app.include_router(speed_analysis.router, prefix="/api/speed", tags=["speed"])
app.include_router(speech_recognition.router, prefix="/api/voice", tags=["voice"])


# 서버 시작 이벤트
# 서버 시작 이벤트
@app.on_event("startup")
async def startup():
    # 서버 시작 시 필요한 초기화 작업
    # 데이터베이스 연결 확인 등
    print("서버가 시작되었습니다.")
    print(f"데이터베이스 연결: {engine.url}")

    from sqlalchemy import text  # 꼭 추가해줘!

try:
    print("💡 try 블록 진입")

    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1;"))  # text()로 감싸야 함
        one = result.fetchone()
        print(f"✅ 데이터베이스 연결 성공! 결과: {one}")
except Exception as e:
    import traceback
    print(f"❌ 데이터베이스 연결 실패: {e}")
    traceback.print_exc()


    # 디렉토리 확인
    print(f"업로드 디렉토리 확인: {os.path.exists('uploads/audio')} (audio), {os.path.exists('uploads/images')} (images)")

# 서버 종료 이벤트
@app.on_event("shutdown")
async def shutdown():
    # 서버 종료 시 정리 작업
    print("서버가 종료됩니다.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)