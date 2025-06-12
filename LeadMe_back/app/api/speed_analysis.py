# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
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
from services.vocal_fatigue_service import VocalFatigueAnalysisService

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
vocal_fatigue_service = VocalFatigueAnalysisService()

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
        current_user: models.User = Depends(get_current_user)
):
    logger.info(f"[START] analyze_audio_file called - filename: {file.filename}, user_id: {current_user.user_id}")
    logger.info(f"[ROUTER CALLED] POST /analyze-audio-file/ - {file.filename}")
    
    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        logger.warning(f"지원되지 않는 파일 형식: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a, .ogg 형식만 허용됩니다."
        )

    try:
        original_ext = os.path.splitext(file.filename)[1].lower()
        is_convert_needed = original_ext != ".wav"
        logger.info(f"파일 확장자: {original_ext}, 변환 필요: {is_convert_needed}")

        # 1. 원본 임시 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)
        logger.info(f"임시 파일 저장 완료: {temp_file_path}")

        # 2. wav 변환 필요하면 변환
        if is_convert_needed:
            wav_temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            wav_temp_path = wav_temp_file.name
            wav_temp_file.close()

            logger.info(f"wav 변환 시작: {temp_file_path} -> {wav_temp_path}")
            try:
                convert_m4a_to_wav(temp_file_path, wav_temp_path)
                logger.info("wav 변환 완료")
                inspect_audio_file(wav_temp_path)
                used_audio_path = wav_temp_path
            except Exception as e:
                logger.error(f"wav 변환 실패: {e}")
                raise RuntimeError("m4a 파일을 wav로 변환하는 중 오류가 발생했습니다.")
        else:
            used_audio_path = temp_file_path
            logger.info("wav 변환 불필요, 원본 사용")

        # 사용자 및 기준값 가져오기
        user_id = current_user.user_id
        logger.info(f"사용자 ID: {user_id}, 연령대: {current_user.age_group}")

        db_age_group_speed = db.query(models.AgeGroupSpeechRate).filter(
            models.AgeGroupSpeechRate.age_group == current_user.age_group
        ).first()
        logger.info(f"연령대 속도 기준 조회 완료: {db_age_group_speed}")

        # 음성 로드 및 분석
        logger.info(f"librosa 음성 로드 시작: {used_audio_path}")
        y, sr = librosa.load(used_audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)
        logger.info(f"음성 로드 완료 - duration: {duration:.2f}초, sr: {sr}")

        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr
        voiced_percentage = voiced_duration / duration * 100
        logger.info(f"음성 프레임 분석 완료 - voiced_duration: {voiced_duration:.2f}초, voiced_percentage: {voiced_percentage:.1f}%")

        # STT 호출
        logger.info("OpenAI Whisper STT 호출 시작")
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
        logger.info(f"SPM 계산 완료: {spm}")

        # 속도 카테고리 판단
        age_group = current_user.age_group
        logger.info(f"사용자 연령대: {age_group}")

        if age_group == "5~12세":
            if spm <= 110:
                speed_category = "느림"
            elif spm >= 161:
                speed_category = "빠름"
            else:
                speed_category = "정상"
        elif age_group == "13~19세":
            if spm <= 140:
                speed_category = "느림"
            elif spm >= 251:
                speed_category = "빠름"
            else:
                speed_category = "정상"
        elif age_group == "20세 이상상":
            if spm <= 180:
                speed_category = "느림"
            elif spm >= 281:
                speed_category = "빠름"
            else:
                speed_category = "정상"
        else:
            # 기본 fallback (정상으로 설정)
            logger.warning(f"알 수 없는 연령대: {age_group}, 기본 속도 분류 사용")
            if spm < 180:
                speed_category = "느림"
            elif spm > 300:
                speed_category = "빠름"
            else:
                speed_category = "정상"

        logger.info(f"속도 카테고리 결정: {speed_category}")

        # DB 저장
        db_analysis = models.SpeedAnalysis(
            user_id=user_id,
            spm=spm,
            speed_category=speed_category,
            analysis_date=datetime.utcnow().date()
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        logger.info(f"DB 저장 완료 (analysis_id: {db_analysis.analysis_id})")

        # 결과 반환 데이터 준비
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

        # 업로드 파일 영구 저장
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        permanent_filename = f"speech_{user_id}_{timestamp}{original_ext}"
        permanent_path = os.path.join(UPLOAD_DIR, permanent_filename)

        shutil.copy2(temp_file_path, permanent_path)
        logger.info(f"영구 저장 완료: {permanent_path}")

        # 임시파일 삭제 예약
        if background_tasks:
            background_tasks.add_task(os.remove, temp_file_path)
            if is_convert_needed:
                background_tasks.add_task(os.remove, wav_temp_path)
            logger.info("임시 파일 삭제 작업 백그라운드 예약 완료")
        else:
            os.remove(temp_file_path)
            if is_convert_needed:
                os.remove(wav_temp_path)
            logger.info("임시 파일 즉시 삭제 완료")

        analysis_result["file_path"] = permanent_path
        analysis_result["file_url"] = f"/uploads/audio/{permanent_filename}"

        logger.info("[END] analyze_audio_file 성공적으로 종료")

        return JSONResponse(status_code=201, content=analysis_result)

    except Exception as e:
        logger.error(f"[ERROR] 음성 분석 중 예외 발생: {str(e)}", exc_info=True)
        # 임시파일 존재하면 삭제
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        if 'wav_temp_path' in locals() and os.path.exists(wav_temp_path):
            os.remove(wav_temp_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/analyze-audio/", status_code=status.HTTP_201_CREATED)
async def analyze_uploaded_audio(
        file: UploadFile = File(...)

):
    """
    업로드된 음성 파일을 분석하여 SPM 반환합니다. (로그인 불필요)

    Args:
        file: 분석할 음성 파일

    Returns:
        SPM 분석 결과
    """
    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a, .ogg 형식만 허용됩니다."
        )

    temp_file_path = None
    wav_temp_path = None

    try:
        original_ext = os.path.splitext(file.filename)[1].lower()
        is_convert_needed = original_ext != ".wav"

        # 1. 원본 임시 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_ext) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)

        # 2. wav 변환 필요하면 변환
        if is_convert_needed:
            wav_temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            wav_temp_path = wav_temp_file.name
            wav_temp_file.close()

            convert_m4a_to_wav(temp_file_path, wav_temp_path)
            used_audio_path = wav_temp_path
        else:
            used_audio_path = temp_file_path

        # 3. 음성 로드 및 분석
        y, sr = librosa.load(used_audio_path, sr=None)
        duration = librosa.get_duration(y=y, sr=sr)

        # 음성 활성화 검출
        frames = librosa.effects.split(y, top_db=20)
        voiced_duration = sum(f[1] - f[0] for f in frames) / sr
        voiced_percentage = voiced_duration / duration * 100

        # 4. STT 호출하여 음절 수 계산
        stt_result = OpenAI_Whisper.speech_to_text(used_audio_path)

        if stt_result["status"] == "success":
            text = stt_result["text"]
            syllables_count = OpenAI_Whisper.count_korean_syllables(text)
        else:
            # STT 실패 시 추정치 사용 (한국어 평균 발화 속도로 추정)
            syllables_count = int(voiced_duration * 4.5)

        # 5. SPM 계산
        spm = int(syllables_count / duration * 60) if duration > 0 else 0

        # 6. 결과 반환 (SPM과 기본 정보만)
        analysis_result = {
            "status": "success",
            "duration": round(duration, 2),
            "voiced_duration": round(voiced_duration, 2),
            "voiced_percentage": round(voiced_percentage, 1),
            "syllables_estimate": syllables_count,
            "spm": spm
        }

        # STT 결과 추가 (성공한 경우)
        if stt_result["status"] == "success":
            analysis_result["stt_text"] = stt_result["text"]
            analysis_result["stt_confidence"] = stt_result.get("confidence", 0)
        return analysis_result

    except Exception as e:
        logger.error(f"[ERROR] 음성 분석 중 예외 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 분석 중 오류가 발생했습니다: {str(e)}"
        )

    finally:
        # 임시 파일 정리
        try:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info("원본 임시 파일 삭제 완료")
            if wav_temp_path and os.path.exists(wav_temp_path):
                os.remove(wav_temp_path)
                logger.info("변환된 임시 파일 삭제 완료")
        except Exception as cleanup_error:
            logger.warning(f"임시 파일 정리 중 오류: {cleanup_error}")


@router.post("/analyze-vocal-fatigue/", status_code=status.HTTP_201_CREATED)
async def analyze_vocal_fatigue(
        file: UploadFile = File(...),
        current_user: models.User = Depends(get_current_user)
):
    """
    음성 피로도 분석 API (12구간 하이퍼볼릭 모델)
    최소 1분 이상의 음성 파일이 필요합니다.
    그래프 이미지 파일을 생성하고 파일 경로를 반환합니다.
    """
    logger.info(f"[START] analyze_vocal_fatigue called - filename: {file.filename}, user_id: {current_user.user_id}")

    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        logger.warning(f"지원되지 않는 파일 형식: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .wav, .mp3, .m4a, .ogg 형식만 허용됩니다."
        )

    try:
        # 파일 데이터 읽기
        audio_data = await file.read()
        user_id = current_user.user_id
        
        logger.info(f"음성 파일 크기: {len(audio_data)} bytes")

        # 음성 피로도 분석 실행 (DB 저장 안함)
        logger.info("음성 피로도 분석 시작")
        analysis_result = vocal_fatigue_service.analyze_audio_file_12segments(
            audio_data=audio_data,
            user_id=None,  # DB 저장하지 않음
            save_to_db=False
        )

        if analysis_result["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=analysis_result.get("error", "분석 중 오류가 발생했습니다.")
            )

        # 그래프 이미지 파일 저장
        if analysis_result.get("graph_available"):
            # static/graphs 디렉토리 생성
            graph_dir = "static/graphs"
            os.makedirs(graph_dir, exist_ok=True)
            
            # 해당 사용자의 기존 그래프 파일들 삭제
            import glob
            existing_files = glob.glob(os.path.join(graph_dir, f"vocal_fatigue_analysis_{user_id}_*.png"))
            for old_file in existing_files:
                try:
                    os.remove(old_file)
                    logger.info(f"기존 그래프 파일 삭제: {old_file}")
                except Exception as e:
                    logger.warning(f"기존 파일 삭제 실패: {old_file}, 오류: {e}")
            
            # 고정된 파일명으로 새 그래프 파일 생성
            graph_filename = f"vocal_fatigue_analysis_{user_id}.png"
            graph_path = os.path.join(graph_dir, graph_filename)
            
            # Base64 이미지를 파일로 저장
            import base64
            if analysis_result.get("graph_image"):
                image_data = base64.b64decode(analysis_result["graph_image"])
                with open(graph_path, "wb") as f:
                    f.write(image_data)
                
                # 웹에서 접근 가능한 URL 생성
                graph_url = f"/static/graphs/{graph_filename}"
                
                logger.info(f"그래프 이미지 저장 완료: {graph_path}")
            else:
                graph_path = None
                graph_url = None
        else:
            graph_path = None
            graph_url = None

        # 반환 데이터 구성
        result = {
            "status": "success",
            "filename": file.filename,
            "spm_analysis": analysis_result.get("spm_analysis"),
            "audio_info": analysis_result.get("audio_info"),
            "graph_path": graph_path,
            "graph_url": graph_url,
            "graph_available": analysis_result.get("graph_available", False)
        }
        
        # 모델 결과가 있으면 추가
        if "parameters" in analysis_result:
            result["model_parameters"] = analysis_result["parameters"]
        if "model_quality" in analysis_result:
            result["model_quality"] = analysis_result["model_quality"]
        
        logger.info("[END] analyze_vocal_fatigue 성공적으로 종료")
        return JSONResponse(status_code=201, content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] 음성 피로도 분석 중 예외 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"음성 피로도 분석 중 오류가 발생했습니다: {str(e)}"
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
