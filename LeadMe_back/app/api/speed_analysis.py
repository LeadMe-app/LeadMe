# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
import shutil
import librosa
from datetime import datetime, date
# 내부 모듈 임포트
from database import get_db
import models
from schemas.speech import SpeedAnalysisCreate, SpeedAnalysisResponse
from schemas.user import UserSettingsCreate, UserSettingsResponse
from app.api.auth import get_current_user  # 현재 로그인한 사용자 가져오기

router = APIRouter()

# 업로드 디렉토리 설정
UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.post("/analyze-audio-file/", status_code=status.HTTP_201_CREATED)
async def analyze_audio_file(
        file: UploadFile = File(...),
        background_tasks: BackgroundTasks = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)  # 현재 로그인한 사용자 가져오기
):
    """
    음성 파일을 분석하여 발화 속도를 측정하고 결과를 DB에 저장합니다.
    현재 로그인한 사용자의 ID가 자동으로 사용됩니다.

    Args:
        file: 분석할 음성 파일
        background_tasks: 백그라운드 작업
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        분석 결과
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

        # 파일 분석
        analysis_result = analyze_speech(temp_file_path)

        # 현재 사용자 ID 사용
        user_id = current_user.user_id

        # 연령대별 발화 속도 정보 조회
        db_age_group_speed = db.query(models.AgeGroupSpeechRate).filter(
            models.AgeGroupSpeechRate.age_group == current_user.age_group
        ).first()

        # 속도 카테고리 결정
        speed_category = "정상"
        if db_age_group_speed:
            if analysis_result["spm"] <= db_age_group_speed.slow_rate:
                speed_category = "느림"
            elif analysis_result["spm"] >= db_age_group_speed.fast_rate:
                speed_category = "빠름"
        else:
            # 기본 기준 적용
            if analysis_result["spm"] < 180:
                speed_category = "느림"
            elif analysis_result["spm"] > 300:
                speed_category = "빠름"

        # 분석 결과 저장 (항상 저장)
        db_analysis = models.SpeedAnalysis(
            user_id=user_id,
            spm=analysis_result["spm"],
            speed_category=speed_category,
            analysis_date=datetime.utcnow().date()
        )

        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        # 분석 결과에 데이터베이스 ID와 카테고리 추가
        analysis_result["db_analysis_id"] = db_analysis.analysis_id
        analysis_result["speed_category"] = speed_category
        analysis_result["user_id"] = user_id

        # 백그라운드 작업에 임시 파일 삭제 추가
        if background_tasks:
            background_tasks.add_task(os.remove, temp_file_path)
        else:
            os.remove(temp_file_path)

        # 영구 파일 저장 (선택 사항)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        permanent_filename = f"speech_{user_id}_{timestamp}{os.path.splitext(file.filename)[1]}"
        permanent_path = os.path.join(UPLOAD_DIR, permanent_filename)

        # 임시 파일을 영구 파일로 복사
        shutil.copy2(temp_file_path, permanent_path)
        analysis_result["file_path"] = permanent_path
        analysis_result["file_url"] = f"/uploads/audio/{permanent_filename}"

        return analysis_result

    except Exception as e:
        # 오류 발생 시 임시 파일 삭제
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 분석 중 오류가 발생했습니다: {str(e)}"
        )


def analyze_speech(audio_file):
    """
    음성 파일을 분석하여 발화 속도 및 기타 정보를 추출합니다.
    """
    try:
        # 파일 로드
        y, sr = librosa.load(audio_file, sr=None)  # 원본 샘플링 레이트 유지

        # 기본 정보 추출
        duration = librosa.get_duration(y=y, sr=sr)

        # 음성 활성화 검출
        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr

        # 음절 수 추정 (한국어에 최적화)
        syllables_estimate = int(voiced_duration * 4.5)  # 한국어 평균 발화 속도

        # SPM 계산
        spm = int(syllables_estimate / duration * 60)

        # 결과 반환
        return {
            "duration": round(duration, 2),
            "voiced_duration": round(voiced_duration, 2),
            "voiced_percentage": round(voiced_duration / duration * 100, 1),
            "syllables_estimate": syllables_estimate,
            "spm": spm
        }
    except Exception as e:
        # 오류 상세 로깅
        import logging
        logging.error(f"음성 분석 중 오류 발생: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())

        # 기본값 반환
        return {
            "duration": 0,
            "voiced_duration": 0,
            "voiced_percentage": 0,
            "syllables_estimate": 0,
            "spm": 0,
            "error": str(e)
        }