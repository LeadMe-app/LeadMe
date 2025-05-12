from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User
from services.age_based_speech_trainer import get_sentence_for_age_group
from services.word_based_speech_trainer import get_sentence_for_word_and_age

router = APIRouter()

''' 속화증 문장 생성 코드 '''

# 연령대별 속도 맵
age_group_speed_map = {
    '5~12세': {'천천히': 2, '중간': 3, '빠르게': 4},
    '13~19세': {'천천히': 3, '중간': 5, '빠르게': 6},
    '20세 이상': {'천천히': 4, '중간': 6, '빠르게': 8}
}

class SentenceRequest(BaseModel):
    user_id: str
    speed_label: str  # "천천히", "중간", "빠르게"

@router.post("/generate", tags=["sentence"])
async def generate_sentence(data: SentenceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        return {"error": "사용자를 찾을 수 없습니다."}

    # 문장 생성
    sentence = await get_sentence_for_age_group(user.age_group)

    # 속도 값 계산
    speed_value = age_group_speed_map.get(user.age_group, {}).get(data.speed_label, 4)

    return {
        "sentence": sentence,
        "speed": speed_value,
        "age_group": user.age_group,
        "speed_label": data.speed_label
    }


''' 말더듬증 문장 생성 코드 '''

class WordSentenceRequest(BaseModel):
    user_id: str
    word: str

@router.post("/generate/word", tags=["sentence"])
async def generate_sentence_with_word(data: WordSentenceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        return {"error": "사용자를 찾을 수 없습니다."}

    sentence = await get_sentence_for_word_and_age(data.word, user.age_group)
    return {
        "sentence": sentence,
        "word": data.word,
        "age_group": user.age_group
    }