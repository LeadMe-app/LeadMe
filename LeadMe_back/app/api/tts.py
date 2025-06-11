# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException, status, Query, Body, Request
from typing import Optional, Dict
import asyncio
import json

# 내부 모듈 임포트
from services.amazon_polly import AmazonPollyService
from models import User
from database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

router = APIRouter()
polly_service = AmazonPollyService()

# 임시 문장 저장소 (실제 프로덕션에서는 Redis나 데이터베이스 사용 권장)
# 키: 세션ID 또는 사용자ID, 값: 생성된 문장
sentences_cache: Dict[str, str] = {}


@router.post("/generate-sentence/")
async def generate_sentence(
        age_group: str = Query(..., description="사용자 연령대 ('5~12세', '13~19세', '20세 이상')"),
        custom_text: Optional[str] = Query(None, description="사용자 지정 텍스트 (선택 사항)"),
        user_id: Optional[str] = Query(None, description="사용자 ID (세션 관리용)"),
        request: Request = None
):
    """
    연령대에 맞는 문장을 생성하는 API 엔드포인트
    생성된 문장은 임시 저장소에 보관하여 TTS 요청 시 재사용 가능

    Args:
        age_group: 사용자 연령대
        custom_text: 사용자 지정 텍스트 (선택 사항)
        user_id: 사용자 ID (없으면 클라이언트 IP 사용)
        request: 요청 객체

    Returns:
        생성된 문장
    """
    try:
        # 문장 생성
        sentence = await polly_service.get_sentence_based_on_age(age_group, custom_text)

        # 사용자 식별자 생성 (사용자 ID 또는 클라이언트 IP)
        identifier = user_id or request.client.host if request else "anonymous"

        # 임시 저장소에 문장 보관
        sentences_cache[identifier] = sentence

        return {
            "status": "success",
            "sentence": sentence,
            "user_id": identifier
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문장 생성 중 오류가 발생했습니다: {str(e)}"
        )

#속화증 tts - amazone_polly
@router.post("/text-to-speech/")
async def text_to_speech(
        text: Optional[str] = Query(None, description="변환할 텍스트 (직접 제공 시)"),
        user_id: Optional[str] = Query(None, description="사용자 ID (세션 관리용)"),
        speaker: str = Query("Seoyeon", description="음성 화자 (기본값: Seoyeon - 한국어 여성)"),
        speed: str = Query("중간", description="읽기 속도 ('천천히', '중간', '빠르게')"),
        age_group: str = Query("20세 이상", description="사용자 연령대 ('5~12세', '13~19세', '20세 이상')"),
        request: Request = None,
        db: Session = Depends(get_db)
):
    """
    텍스트를 음성으로 변환하는 API 엔드포인트
    text가 제공되지 않으면 이전에 생성된 문장 사용

    Args:
        text: 변환할 텍스트 (선택 사항)
        user_id: 사용자 ID (세션 관리용)
        speaker: 음성 화자
        speed: 읽기 속도
        age_group: 사용자 연령대
        request: 요청 객체
        db: 데이터베이스 세션

    Returns:
        생성된 오디오 파일 정보
    """
    # 사용자 식별자 생성
    identifier = user_id or request.client.host if request else "anonymous"

    # 변환할 텍스트 결정 (직접 제공 또는 캐시에서 가져오기)
    content_to_convert = text

    # 직접 제공된 텍스트가 없으면 캐시에서 찾기
    if not content_to_convert and identifier in sentences_cache:
        content_to_convert = sentences_cache[identifier]

    # 그래도 텍스트가 없으면 오류
    if not content_to_convert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="변환할 텍스트가 제공되지 않았으며, 캐시된 문장도 없습니다."
        )

    # 텍스트 길이 제한
    if len(content_to_convert) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="텍스트가 너무 깁니다. 최대 1000자까지 입력 가능합니다."
        )

    try:
        # TTS 서비스 호출
        result = polly_service.text_to_speech(
            text=content_to_convert,
            age_group=age_group,
            speed_label=speed,
            voice_id=speaker
        )

        if result["status"] == "success":
            # 결과에 사용된 텍스트 추가
            result["text"] = content_to_convert
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"TTS 처리 중 오류가 발생했습니다: {result.get('error_message', '알 수 없는 오류')}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"텍스트 변환 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/refresh-sentence/")
async def refresh_sentence(
        age_group: str = Query(..., description="사용자 연령대 ('5~12세', '13~19세', '20세 이상')"),
        user_id: Optional[str] = Query(None, description="사용자 ID (세션 관리용)"),
        request: Request = None
):
    """
    새로운 문장을 생성하는 API 엔드포인트 (새로고침 버튼용)

    Args:
        age_group: 사용자 연령대
        user_id: 사용자 ID
        request: 요청 객체

    Returns:
        새로 생성된 문장
    """
    return await generate_sentence(age_group=age_group, custom_text=None, user_id=user_id, request=request)