# -*- coding: utf-8 -*-
import uvicorn
import os
import psycopg2
import email_validator
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

if __name__ == "__main__":
    # 서버 실행
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True if os.getenv("ENVIRONMENT", "development") == "development" else False
    )