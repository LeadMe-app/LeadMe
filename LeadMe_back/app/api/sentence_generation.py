# app/api/sentence_generation.py
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User  # 사용자 테이블
from services.openai_client import get_sentence_for_age_group

router = APIRouter()

class SentenceRequest(BaseModel):
    user_id: int

@router.post("/generate", tags=["sentence"])
async def generate_sentence(data: SentenceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        return {"error": "사용자를 찾을 수 없습니다."}

    sentence = await get_sentence_for_age_group(user.age_group)
    return {"sentence": sentence}
