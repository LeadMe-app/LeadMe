# -*- coding: utf-8 -*-
from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import tempfile
from datetime import datetime
import shutil

# 내부 모듈 임포트
from services.naver_clova import NaverClovaService
from services.opensmile import OpenSmileService

router = APIRouter()


@router.post("/stt/")
async def speech_to_text(
        file: UploadFile = File(...),
        background_tasks: BackgroundTasks = None
):
    """
    음성 파일을 텍스트로 변환 (STT)

    Args:
        file: 음성 파일 (.wav, .mp3, .m4a 등)
        background_tasks: 백그라운드 작업 객체

    Returns:
        변환된 텍스트 및 분석 결과
    """
    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a, .ogg 형식만 허용됩니다."
        )

    try:
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)

        # 네이버 클로바 STT 서비스 호출
        stt_result = NaverClovaService.speech_to_text(temp_file_path)

        # 백그라운드 작업에 임시 파일 삭제 추가
        if background_tasks:
            background_tasks.add_task(os.remove, temp_file_path)
        else:
            os.remove(temp_file_path)

        if stt_result["status"] == "success":
            # STT 성공
            return {
                "status": "success",
                "text": stt_result["text"],
                "confidence": stt_result.get("confidence", 0),
                "message": "음성이 성공적으로 텍스트로 변환되었습니다."
            }
        else:
            # STT 실패
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"STT 처리 중 오류가 발생했습니다: {stt_result.get('error_message', '알 수 없는 오류')}"
            )

    except Exception as e:
        # 파일 처리 또는 API 호출 중 발생한 오류
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/tts/")
async def text_to_speech(
        text: str,
        speaker: str = "nara",
        speed: int = 0
):
    """
    텍스트를 음성으로 변환 (TTS)

    Args:
        text: 변환할 텍스트
        speaker: 화자 (기본값: 'nara' - 한국어 여성)
        speed: 읽기 속도 (-5 ~ 5, 기본값: 0)

    Returns:
        생성된 음성 파일 경로
    """
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="변환할 텍스트를 입력해주세요."
        )

    # 텍스트 길이 제한 (Naver API 제한: 최대 1000자)
    if len(text) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="텍스트가 너무 깁니다. 최대 1000자까지 입력 가능합니다."
        )

    try:
        # 저장 디렉토리 생성
        output_dir = "uploads/audio/tts"
        os.makedirs(output_dir, exist_ok=True)

        # 출력 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        output_file = f"{output_dir}/tts_{timestamp}.mp3"

        # 네이버 클로바 TTS 서비스 호출
        tts_result = NaverClovaService.text_to_speech(
            text=text,
            output_file_path=output_file,
            speaker=speaker,
            speed=speed
        )

        if tts_result["status"] == "success":
            # TTS 성공
            return {
                "status": "success",
                "file_path": output_file,
                "file_url": f"/uploads/audio/tts/tts_{timestamp}.mp3",
                "message": "텍스트가 성공적으로 음성으로 변환되었습니다."
            }
        else:
            # TTS 실패
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"TTS 처리 중 오류가 발생했습니다: {tts_result.get('error_message', '알 수 없는 오류')}"
            )

    except Exception as e:
        # API 호출 중 발생한 오류
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"텍스트 변환 중 오류가 발생했습니다: {str(e)}"
        )