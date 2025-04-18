# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import subprocess
import json
from datetime import datetime, date

# 내부 모듈 임포트
from database import get_db
import models
from schemas.speech import SpeedAnalysisCreate, SpeedAnalysisResponse
from schemas.user import UserSettingsCreate, UserSettingsResponse

router = APIRouter()


@router.post("/analysis/", response_model=SpeedAnalysisResponse, status_code=status.HTTP_201_CREATED)
def create_speed_analysis(
        analysis: SpeedAnalysisCreate,
        db: Session = Depends(get_db)
):
    """새로운 발화 속도 분석 결과를 저장합니다."""
    # 사용자 존재 여부 확인
    db_user = db.query(models.User).filter(models.User.user_id == analysis.user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )

    # 연령대별 발화 속도 정보 조회
    db_age_group_speed = db.query(models.AgeGroupSpeechRate).filter(
        models.AgeGroupSpeechRate.age_group == db_user.age_group
    ).first()

    # 속도 카테고리 결정
    speed_category = "정상"
    if db_age_group_speed:
        if analysis.spm <= db_age_group_speed.slow_rate:
            speed_category = "느림"
        elif analysis.spm >= db_age_group_speed.fast_rate:
            speed_category = "빠름"

    # 새 분석 결과 생성
    db_analysis = models.SpeedAnalysis(
        user_id=analysis.user_id,
        spm=analysis.spm,
        speed_category=speed_category,
        analysis_date=datetime.utcnow().date()
    )

    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    return db_analysis


@router.get("/analysis/", response_model=List[SpeedAnalysisResponse])
def read_speed_analyses(
        user_id: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """발화 속도 분석 결과 목록을 반환합니다. 선택적으로 사용자 ID 및 날짜로 필터링합니다."""
    query = db.query(models.SpeedAnalysis)

    if user_id:
        query = query.filter(models.SpeedAnalysis.user_id == user_id)

    if start_date:
        query = query.filter(models.SpeedAnalysis.analysis_date >= start_date)

    if end_date:
        query = query.filter(models.SpeedAnalysis.analysis_date <= end_date)

    # 날짜 기준 내림차순 정렬
    query = query.order_by(models.SpeedAnalysis.analysis_date.desc())

    analyses = query.offset(skip).limit(limit).all()
    return analyses


@router.get("/analysis/{analysis_id}", response_model=SpeedAnalysisResponse)
def read_speed_analysis(
        analysis_id: int,
        db: Session = Depends(get_db)
):
    """특정 발화 속도 분석 결과를 반환합니다."""
    db_analysis = db.query(models.SpeedAnalysis).filter(models.SpeedAnalysis.analysis_id == analysis_id).first()
    if db_analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 분석 결과를 찾을 수 없습니다."
        )
    return db_analysis


@router.delete("/analysis/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_speed_analysis(
        analysis_id: int,
        db: Session = Depends(get_db)
):
    """발화 속도 분석 결과를 삭제합니다."""
    db_analysis = db.query(models.SpeedAnalysis).filter(models.SpeedAnalysis.analysis_id == analysis_id).first()
    if db_analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 분석 결과를 찾을 수 없습니다."
        )

    db.delete(db_analysis)
    db.commit()
    return None


@router.post("/settings/", response_model=UserSettingsResponse, status_code=status.HTTP_201_CREATED)
def create_user_settings(
        settings: UserSettingsCreate,
        db: Session = Depends(get_db)
):
    """사용자의 선호 발화 속도 설정을 저장합니다."""
    # 사용자 존재 여부 확인
    db_user = db.query(models.User).filter(models.User.user_id == settings.user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )

    # 이미 설정이 있는지 확인
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == settings.user_id).first()

    if db_settings:
        # 기존 설정 업데이트
        db_settings.selected_speech_rate = settings.selected_speech_rate
    else:
        # 새 설정 생성
        db_settings = models.UserSettings(
            user_id=settings.user_id,
            selected_speech_rate=settings.selected_speech_rate
        )
        db.add(db_settings)

    db.commit()
    db.refresh(db_settings)

    return db_settings


@router.get("/settings/{user_id}", response_model=UserSettingsResponse)
def read_user_settings(
        user_id: str,
        db: Session = Depends(get_db)
):
    """사용자의 선호 발화 속도 설정을 반환합니다."""
    db_settings = db.query(models.UserSettings).filter(models.UserSettings.user_id == user_id).first()
    if db_settings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자의 설정을 찾을 수 없습니다."
        )
    return db_settings


@router.post("/analyze-audio/")
async def analyze_audio_speed(
        file: UploadFile = File(...),
        user_id: Optional[str] = None
):
    """음성 파일을 업로드하고 OpenSMILE을 사용하여 발화 속도를 분석합니다."""

    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a 형식만 허용됩니다."
        )

    # 업로드 디렉토리 경로
    UPLOAD_DIR = "uploads/audio"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 파일명 생성
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{user_id}_{timestamp}_{file.filename}" if user_id else f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 파일 저장
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        # 여기에 OpenSMILE을 사용한 분석 코드가 들어갈 예정
        # 현재는 임시 결과 반환

        # 실제 환경에서는 아래와 같이 OpenSMILE 호출 예정
        # opensmile_result = subprocess.run(
        #     ["path/to/opensmile", "-I", file_path, "-C", "config/speech_rate.conf"],
        #     capture_output=True,
        #     text=True
        # )

        # 간단한 테스트 결과 샘플
        result = {
            "file_path": file_path,
            "analysis": {
                "spm": 240,  # 분당 음절 수 (Syllables Per Minute)
                "speech_rate_category": "normal",
                "duration_seconds": 15.3,
                "total_syllables": 62
            }
        }

        return result

    except Exception as e:
        # 파일 삭제
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"분석 중 오류가 발생했습니다: {str(e)}"
        )