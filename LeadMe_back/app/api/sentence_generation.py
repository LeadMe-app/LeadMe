from fastapi import APIRouter, Depends
from typing import Optional, Dict
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User
from services.age_based_speech_trainer import get_sentence_for_age_group
from services.word_based_speech_trainer import get_sentence_for_word_and_age
from services.amazon_polly import AmazonPollyService
from services.stuttering_tts_service import StutteringTTSService

router = APIRouter()
polly_service = AmazonPollyService()
stuttering_tts_service = StutteringTTSService()  # ✅ 초기화
sentences_cache: Dict[str, str] = {}

''' 속화증 문장 생성 코드 '''

class SentenceRequest(BaseModel):
    user_id: str

@router.post("/generate", tags=["sentence"])
async def generate_sentence(data: SentenceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        return {"error": "사용자를 찾을 수 없습니다."}

    # 문장 생성
    sentence = await get_sentence_for_age_group(user.age_group)

    sentences_cache[data.user_id] = sentence
    return {"sentence": sentence}


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

''' 말더듬증 tts 코드'''
@router.post("/generate/word/tts", tags=["sentence"])
async def generate_word_sentence_tts(data: WordSentenceRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        return {"error": "사용자를 찾을 수 없습니다."}

    # 1. 문장 생성
    sentence = await get_sentence_for_word_and_age(data.word, user.age_group)

    # 2. 말더듬증 전용 TTS 생성 (stuttering_tts_service 사용, 속도 고정)
    tts_result = stuttering_tts_service.text_to_speech(
        text=sentence,
        user_id=data.user_id,
        voice_id="Seoyeon"
    )

    # 3. 결과 반환
    if tts_result["status"] == "success":
        return {
            "sentence": sentence,
            "word": data.word,
            "age_group": user.age_group,
            "tts_url": tts_result["file_url"]
        }
    else:
        return {
            "sentence": sentence,
            "word": data.word,
            "age_group": user.age_group,
            "error": tts_result["error_message"]
        }
