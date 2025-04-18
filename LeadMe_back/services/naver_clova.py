# -*- coding: utf-8 -*-
import os
import requests
from typing import Optional, Dict, Any
import json
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# 환경 변수에서 API 키 가져오기
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

# API 엔드포인트
STT_URL = "https://naveropenapi.apigw.ntruss.com/recog/v1/stt"
TTS_URL = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"


class NaverClovaService:
    """네이버 클로바 API 서비스 클래스"""

    @staticmethod
    def speech_to_text(audio_file_path: str, language: str = "Kor") -> Dict[str, Any]:
        """
        음성 파일을 텍스트로 변환 (STT)

        Args:
            audio_file_path: 음성 파일 경로
            language: 언어 코드 (기본값: 한국어 'Kor')

        Returns:
            Dict: API 응답 (텍스트 및 상태 정보)
        """
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            raise ValueError("네이버 클로바 API 인증 정보가 설정되지 않았습니다.")

        headers = {
            "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
            "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
            "Content-Type": "application/octet-stream"
        }

        params = {
            "lang": language
        }

        try:
            with open(audio_file_path, "rb") as f:
                audio_data = f.read()

            response = requests.post(
                url=STT_URL,
                headers=headers,
                params=params,
                data=audio_data
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "status": "success",
                    "text": result.get("text", ""),
                    "confidence": result.get("confidence", 0)
                }
            else:
                return {
                    "status": "error",
                    "error_code": response.status_code,
                    "error_message": response.text
                }

        except Exception as e:
            return {
                "status": "error",
                "error_message": str(e)
            }

    @staticmethod
    def text_to_speech(
            text: str,
            output_file_path: str,
            speaker: str = "nara",
            speed: int = 0,
            pitch: int = 0,
            volume: int = 0,
            emotion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        텍스트를 음성으로 변환 (TTS)

        Args:
            text: 변환할 텍스트 (최대 1000자)
            output_file_path: 저장할 파일 경로
            speaker: 화자 (기본값: 'nara' - 한국어 여성)
            speed: 읽기 속도 (-5 ~ 5, 기본값: 0)
            pitch: 음성 높낮이 (-5 ~ 5, 기본값: 0)
            volume: 음성 볼륨 (-5 ~ 5, 기본값: 0)
            emotion: 감정 표현 (none, happy, sad, angry, 기본값: none)

        Returns:
            Dict: API 응답 (성공 여부 및 상태 정보)
        """
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            raise ValueError("네이버 클로바 API 인증 정보가 설정되지 않았습니다.")

        headers = {
            "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
            "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "speaker": speaker,
            "text": text,
            "speed": str(speed),
            "pitch": str(pitch),
            "volume": str(volume)
        }

        # 감정 파라미터가 제공된 경우 추가
        if emotion and emotion != "none":
            data["emotion"] = emotion

        try:
            response = requests.post(
                url=TTS_URL,
                headers=headers,
                data=data
            )

            if response.status_code == 200:
                # 음성 파일 저장
                with open(output_file_path, "wb") as f:
                    f.write(response.content)

                return {
                    "status": "success",
                    "file_path": output_file_path,
                    "message": "텍스트가 성공적으로 음성 파일로 변환되었습니다."
                }
            else:
                return {
                    "status": "error",
                    "error_code": response.status_code,
                    "error_message": response.text
                }

        except Exception as e:
            return {
                "status": "error",
                "error_message": str(e)
            }


# 사용 예시
if __name__ == "__main__":
    # STT 예시
    # result = NaverClovaService.speech_to_text("sample.wav")
    # print(result)

    # TTS 예시
    # result = NaverClovaService.text_to_speech(
    #     "안녕하세요, 음성 치료 애플리케이션입니다.",
    #     "output.mp3",
    #     speaker="nara",
    #     speed=0
    # )
    # print(result)
    pass