# -*- coding: utf-8 -*-
import os
import subprocess
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List, Tuple
import tempfile
import time
from datetime import datetime
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("opensmile_service")


class OpenSmileService:
    """OpenSMILE을 이용한 발화 속도 분석 서비스"""

    def __init__(self, opensmile_path: Optional[str] = None, config_path: Optional[str] = None):
        """
        OpenSMILE 서비스 초기화

        Args:
            opensmile_path: OpenSMILE 실행 파일 경로 (None인 경우 환경 변수에서 가져옴)
            config_path: OpenSMILE 설정 파일 경로 (None인 경우 기본 설정 사용)
        """
        # OpenSMILE 경로 설정
        self.opensmile_path = opensmile_path or os.getenv("OPENSMILE_PATH", "opensmile")

        # 설정 파일 경로 설정
        self.config_path = config_path or os.getenv("OPENSMILE_CONFIG_PATH", "config/gemaps/GeMAPSv01a.conf")

        logger.info(f"OpenSMILE 서비스 초기화 - 실행 파일: {self.opensmile_path}, 설정 파일: {self.config_path}")

    def analyze_speech_rate(self, audio_file_path: str) -> Dict[str, Any]:
        """
        음성 파일의 발화 속도 분석

        Args:
            audio_file_path: 분석할 음성 파일 경로

        Returns:
            Dict: 발화 속도 분석 결과
        """
        logger.info(f"파일 분석 시작: {audio_file_path}")
        start_time = time.time()

        try:
            # 1. 임시 출력 파일 생성
            with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as tmp_file:
                tmp_output_path = tmp_file.name

            # 2. OpenSMILE 실행
            # OpenSMILE을 사용하여 음향 특성 추출
            cmd = [
                self.opensmile_path,
                "-I", audio_file_path,
                "-C", self.config_path,
                "-O", tmp_output_path,
                "-l", "0"  # 콘솔 출력 비활성화
            ]

            logger.info(f"OpenSMILE 명령 실행: {' '.join(cmd)}")

            try:
                # 실제 환경에서는 이 부분 주석 해제
                # result = subprocess.run(cmd, check=True, capture_output=True, text=True)
                # logger.info(f"OpenSMILE 실행 결과: {result.stdout}")

                # 테스트 환경에서는 임시로 더미 데이터 생성
                # 임시 CSV 파일에 더미 데이터 작성
                with open(tmp_output_path, 'w') as f:
                    f.write("frameIndex,frameTime,F0,loudness,voiceProbability\n")
                    # 10초 음성 파일 샘플 (100ms 간격으로 프레임)
                    for i in range(100):
                        frame_time = i * 0.1
                        f0 = 120 + 20 * np.sin(frame_time)  # 변동하는 F0 값
                        loudness = 60 + 10 * np.cos(frame_time)  # 변동하는 loudness 값
                        voice_prob = 0.9 if i % 10 < 8 else 0.2  # 음성/비음성 구간 시뮬레이션
                        f.write(f"{i},{frame_time},{f0},{loudness},{voice_prob}\n")

                logger.info("임시 더미 데이터 생성 완료")

            except subprocess.CalledProcessError as e:
                logger.error(f"OpenSMILE 실행 오류: {e}")
                return {
                    "status": "error",
                    "error_message": f"OpenSMILE 실행 중 오류 발생: {str(e)}"
                }

            # 3. 결과 파일 분석
            features = pd.read_csv(tmp_output_path)

            # 4. 발화 속도 계산 (실제 구현에서는 더 복잡한 알고리즘 적용)
            duration_seconds = self._calculate_duration(features)
            voiced_frames = self._count_voiced_frames(features)
            syllables_count = self._estimate_syllables(features, voiced_frames)

            # 분당 음절 수 (SPM) 계산
            spm = int(syllables_count / duration_seconds * 60)

            # 결과 반환
            analysis_result = {
                "status": "success",
                "spm": spm,
                "duration_seconds": float(f"{duration_seconds:.2f}"),
                "syllables_count": syllables_count,
                "voiced_frames": voiced_frames,
                "analysis_timestamp": datetime.now().isoformat()
            }

            # 임시 파일 삭제
            if os.path.exists(tmp_output_path):
                os.remove(tmp_output_path)

            logger.info(f"분석 완료 - 소요 시간: {time.time() - start_time:.2f}초, SPM: {spm}")
            return analysis_result

        except Exception as e:
            logger.error(f"분석 중 오류 발생: {str(e)}")
            return {
                "status": "error",
                "error_message": f"분석 중 오류 발생: {str(e)}"
            }

    def _calculate_duration(self, features: pd.DataFrame) -> float:
        """
        음성 파일의 총 길이 계산

        Args:
            features: OpenSMILE로 추출한 특성 데이터프레임

        Returns:
            float: 음성 길이 (초)
        """
        if "frameTime" in features.columns:
            return features["frameTime"].max()
        else:
            # 기본 프레임 간격이 10ms인 경우
            return len(features) * 0.01

    def _count_voiced_frames(self, features: pd.DataFrame, threshold: float = 0.7) -> int:
        """
        유성음 프레임 수 계산

        Args:
            features: OpenSMILE로 추출한 특성 데이터프레임
            threshold: 유성음으로 판단할 확률 임계값

        Returns:
            int: 유성음 프레임 수
        """
        if "voiceProbability" in features.columns:
            return len(features[features["voiceProbability"] > threshold])
        elif "F0" in features.columns:
            # F0 값이 0보다 큰 경우 유성음으로 판단
            return len(features[features["F0"] > 0])
        else:
            # 기본값: 전체 프레임의 70%를 유성음으로 가정
            return int(len(features) * 0.7)

    def _estimate_syllables(self, features: pd.DataFrame, voiced_frames: int) -> int:
        """
        음절 수 추정

        Args:
            features: OpenSMILE로 추출한 특성 데이터프레임
            voiced_frames: 유성음 프레임 수

        Returns:
            int: 추정 음절 수
        """
        # 실제 구현에서는 더 정교한 알고리즘 적용이 필요함
        # 여기서는 간단한 휴리스틱 사용: 약 100ms(10프레임)당 1음절로 가정
        return max(1, int(voiced_frames / 10))

    def classify_speech_rate(self, spm: int, age_group: str) -> str:
        """
        발화 속도 분류 (느림/정상/빠름)

        Args:
            spm: 분당 음절 수
            age_group: 연령대 ('7세 이하', '8~13세', '14세 이상')

        Returns:
            str: 속도 분류 ('느림', '정상', '빠름')
        """
        # 연령대별 발화 속도 기준 (실제 앱에서는 DB에서 가져와야 함)
        speed_thresholds = {
            "7세 이하": {"slow": 180, "fast": 260},
            "8~13세": {"slow": 200, "fast": 300},
            "14세 이상": {"slow": 220, "fast": 350}
        }

        # 기본값 사용
        if age_group not in speed_thresholds:
            age_group = "14세 이상"

        # 속도 분류
        if spm <= speed_thresholds[age_group]["slow"]:
            return "느림"
        elif spm >= speed_thresholds[age_group]["fast"]:
            return "빠름"
        else:
            return "정상"


# 사용 예시
if __name__ == "__main__":
    # 서비스 초기화
    service = OpenSmileService()

    # 발화 속도 분석
    # result = service.analyze_speech_rate("sample.wav")
    # print(json.dumps(result, indent=2, ensure_ascii=False))

    # 발화 속도 분류
    # category = service.classify_speech_rate(280, "14세 이상")
    # print(f"발화 속도 분류: {category}")
    pass