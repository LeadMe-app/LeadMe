# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
import shutil
import librosa
from pydub import AudioSegment
from datetime import datetime, date
import logging
import subprocess

# 내부 모듈 임포트
from database import get_db
import models
from schemas.speech import SpeedAnalysisCreate, SpeedAnalysisResponse
from schemas.user import UserSettingsCreate, UserSettingsResponse
from app.api.auth import get_current_user
from services.openai_stt import OpenAISTTService
#from services.naver_clova import NaverClovaService


print(f"🔍 DEBUG: 파일명={file.filename}")
print(f"🔍 DEBUG: 사용자={current_user.user_id if current_user else 'None'}")
print(f"🔍 DEBUG: 파일 크기={file.size if hasattr(file, 'size') else 'unknown'}")

router = APIRouter()
logger = logging.getLogger(__name__)

# 로그 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("speed_analysis")

# 업로드 디렉토리 설정
UPLOAD_DIR = "uploads/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# openai whisper 서비스 초기화
OpenAI_Whisper = OpenAISTTService()

def convert_m4a_to_wav(input_path: str, output_path: str):
    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-ac", "1",            # mono
        "-ar", "16000",        # 16kHz
        "-sample_fmt", "s16",  # 16-bit PCM
        output_path,
    ]
    subprocess.run(command, check=True)

def inspect_audio_file(path: str):
    command = ["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if result.returncode == 0:
        print("오디오 파일은 문제 없습니다.")
    else:
        print("오디오 파일에 문제가 있습니다.")
        print(result.stderr.decode("utf-8", errors="ignore"))


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
    네이버 클로바 STT를 활용하여 더 정확한 음절 수를 계산합니다.

    Args:
        file: 분석할 음성 파일
        background_tasks: 백그라운드 작업
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        분석 결과
    """
    print("파일 이름:", file.filename)  # <- 추가

    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a, .ogg 형식만 허용됩니다."
        )

    try:
        original_ext = os.path.splitext(file.filename)[1].lower()
        is_convert_needed = original_ext != ".wav"

        # 1. 원본 임시 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)

        logger.info(f"임시 파일 저장 완료: {temp_file_path}")

        # 2. 변환 필요하면 wav로 변환
        if is_convert_needed:
            wav_temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            wav_temp_path = wav_temp_file.name
            wav_temp_file.close()

            convert_m4a_to_wav(temp_file_path, wav_temp_path)
            inspect_audio_file(wav_temp_path)  # 변환 후 유효성 검사
            used_audio_path = wav_temp_path
        else:
            used_audio_path = temp_file_path

        user_id = current_user.user_id

        db_age_group_speed = db.query(models.AgeGroupSpeechRate).filter(
            models.AgeGroupSpeechRate.age_group == current_user.age_group
        ).first()

        # 오디오 분석
        y, sr = librosa.load(used_audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr
        voiced_percentage = voiced_duration / duration * 100

        logger.info("Whisper STT 호출 시작")
        stt_result = OpenAI_Whisper.speech_to_text(used_audio_path)
        logger.info(f"STT 결과: {stt_result}")

        if stt_result["status"] == "success":
            text = stt_result["text"]
            syllables_count = OpenAI_Whisper.count_korean_syllables(text)
            logger.info(f"STT 성공 - 텍스트: '{text}', 음절 수: {syllables_count}")
        else:
            syllables_count = int(voiced_duration * 4.5)
            logger.warning(f"STT 실패 - 추정 음절 수: {syllables_count}")

        spm = int(syllables_count / duration * 60)
        logger.info(f"분석 결과: 음절 수={syllables_count}, 녹음 길이={duration:.2f}초, SPM={spm}")

        speed_category = "정상"
        if db_age_group_speed:
            if spm <= db_age_group_speed.slow_rate:
                speed_category = "느림"
            elif spm >= db_age_group_speed.fast_rate:
                speed_category = "빠름"
        else:
            if spm < 180:
                speed_category = "느림"
            elif spm > 300:
                speed_category = "빠름"

        db_analysis = models.SpeedAnalysis(
            user_id=user_id,
            spm=spm,
            speed_category=speed_category,
            analysis_date=datetime.utcnow().date()
        )

        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        logger.info(f"분석 결과 DB 저장 완료 (ID: {db_analysis.analysis_id})")

        analysis_result = {
            "status": "success",
            "duration": round(duration, 2),
            "voiced_duration": round(voiced_duration, 2),
            "voiced_percentage": round(voiced_percentage, 1),
            "syllables_estimate": syllables_count,
            "spm": spm,
            "speed_category": speed_category,
            "db_analysis_id": db_analysis.analysis_id,
            "user_id": user_id
        }

        if stt_result["status"] == "success":
            analysis_result["stt_text"] = stt_result["text"]
            analysis_result["stt_confidence"] = stt_result.get("confidence", 0)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        permanent_filename = f"speech_{user_id}_{timestamp}{original_ext}"
        permanent_path = os.path.join(UPLOAD_DIR, permanent_filename)

        shutil.copy2(temp_file_path, permanent_path)

        if background_tasks:
            background_tasks.add_task(os.remove, temp_file_path)
            if is_convert_needed:
                background_tasks.add_task(os.remove, wav_temp_path)
        else:
            os.remove(temp_file_path)
            if is_convert_needed:
                os.remove(wav_temp_path)

        analysis_result["file_path"] = permanent_path
        analysis_result["file_url"] = f"/uploads/audio/{permanent_filename}"

        return analysis_result

    except Exception as e:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if 'wav_temp_path' in locals() and os.path.exists(wav_temp_path):
            os.remove(wav_temp_path)

        logger.error(f"음성 분석 중 오류가 발생했습니다: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/record-audio/", status_code=status.HTTP_201_CREATED)
async def record_and_analyze_audio(
        duration: int = 10,
        user_id: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    마이크로 음성을 녹음하고 발화 속도를 분석합니다.

    Args:
        duration: 녹음 시간(초)
        user_id: 사용자 ID (선택 사항)
        db: 데이터베이스 세션

    Returns:
        녹음 및 분석 결과
    """
    # 여기에 녹음 기능 구현 필요
    # 이 부분은 클라이언트 사이드에서 처리되므로, API 측에서는 분석만 담당

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="현재 서버에서 직접 녹음은 지원되지 않습니다. 클라이언트에서 녹음 후 분석 API를 사용해주세요."
    )


@router.post("/analyze-audio/", status_code=status.HTTP_201_CREATED)
async def analyze_uploaded_audio(
        file: UploadFile = File(...),
        user_id: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    업로드된 음성 파일을 분석합니다. (로그인 불필요)

    Args:
        file: 분석할 음성 파일
        user_id: 사용자 ID (선택 사항)
        db: 데이터베이스 세션

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

        # 사용자 ID가 제공된 경우 해당 사용자 정보 조회
        age_group = "14세 이상"  # 기본값
        if user_id:
            db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
            if db_user:
                age_group = db_user.age_group

        # ===== STT 및 음절 수 계산 시작 =====
        # 1. 오디오 기본 분석
        y, sr = librosa.load(temp_file_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # 음성 활성화 검출
        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr
        voiced_percentage = voiced_duration / duration * 100

        # 2. 네이버 클로바 STT로 텍스트 변환
        stt_result = OpenAI_Whisper.speech_to_text(temp_file_path)

        # 음절 수 계산 (STT 성공 시 텍스트 기반, 실패 시 추정)
        if stt_result["status"] == "success":
            text = stt_result["text"]
            syllables_count = OpenAI_Whisper.count_korean_syllables(text)
        else:
            # STT 실패 시 추정치 사용
            syllables_count = int(voiced_duration * 4.5)  # 한국어 평균 발화 속도로 추정

        # SPM 계산
        spm = int(syllables_count / duration * 60)
        # ===== STT 및 음절 수 계산 종료 =====

        # 연령대별 발화 속도 정보 조회
        db_age_group_speed = db.query(models.AgeGroupSpeechRate).filter(
            models.AgeGroupSpeechRate.age_group == age_group
        ).first()

        # 속도 카테고리 결정
        speed_category = "정상"
        if db_age_group_speed:
            if spm <= db_age_group_speed.slow_rate:
                speed_category = "느림"
            elif spm >= db_age_group_speed.fast_rate:
                speed_category = "빠름"
        else:
            # 기본 기준 적용
            if spm < 180:
                speed_category = "느림"
            elif spm > 300:
                speed_category = "빠름"

        # 사용자 ID가 제공된 경우에만 DB에 저장
        db_analysis_id = None
        if user_id:
            db_analysis = models.SpeedAnalysis(
                user_id=user_id,
                spm=spm,
                speed_category=speed_category,
                analysis_date=datetime.utcnow().date()
            )

            db.add(db_analysis)
            db.commit()
            db.refresh(db_analysis)
            db_analysis_id = db_analysis.analysis_id

        # 분석 결과 구성
        analysis_result = {
            "status": "success",
            "duration": round(duration, 2),
            "voiced_duration": round(voiced_duration, 2),
            "voiced_percentage": round(voiced_percentage, 1),
            "syllables_estimate": syllables_count,
            "spm": spm,
            "speed_category": speed_category
        }

        # DB 저장 정보 추가 (저장된 경우)
        if db_analysis_id:
            analysis_result["db_analysis_id"] = db_analysis_id
            analysis_result["user_id"] = user_id

        # STT 결과 추가 (성공한 경우)
        if stt_result["status"] == "success":
            analysis_result["stt_text"] = stt_result["text"]
            analysis_result["stt_confidence"] = stt_result.get("confidence", 0)

        # 임시 파일 삭제
        os.remove(temp_file_path)

        return analysis_result

    except Exception as e:
        # 오류 발생 시 임시 파일 삭제
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        logger.error(f"음성 분석 중 오류가 발생했습니다: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/analysis/", response_model=List[SpeedAnalysisResponse])
def read_speech_analyses(
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """사용자별 발화 속도 분석 기록을 조회합니다."""
    query = db.query(models.SpeedAnalysis)

    if user_id:
        query = query.filter(models.SpeedAnalysis.user_id == user_id)

    analyses = query.order_by(models.SpeedAnalysis.analysis_date.desc()).offset(skip).limit(limit).all()
    return analyses
