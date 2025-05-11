# -*- coding: utf-8 -*-
import requests
import json
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()


class NaverClovaService:
    """네이버 클로바 API를 사용하여 STT(Speech-to-Text)와 TTS(Text-to-Speech) 기능을 제공하는 서비스 클래스"""

    def __init__(self):
        """클래스 초기화"""
        # 네이버 클로바 API 인증 정보
        self.client_id = os.getenv("NAVER_CLIENT_ID", "7hqv9mf01o")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET", "VpVXg9yfaBP7QliCnyKj8ikW7PT87k2bxiFDWA5z")

    @staticmethod
    def speech_to_text(file_path):
        """
        음성 파일을 텍스트로 변환 (STT)

        Args:
            file_path: 음성 파일 경로

        Returns:
            변환된 텍스트 및 결과 정보
        """
        url = "https://naveropenapi.apigw.ntruss.com/recog/v1/stt?lang=Kor"

        headers = {
            "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_CLIENT_ID", "7hqv9mf01o"),
            "X-NCP-APIGW-API-KEY": os.getenv("NAVER_CLIENT_SECRET", "VpVXg9yfaBP7QliCnyKj8ikW7PT87k2bxiFDWA5z"),
            "Content-Type": "application/octet-stream"
        }

        try:
            with open(file_path, 'rb') as f:
                data = f.read()

            response = requests.post(url, headers=headers, data=data)

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
                    "error_message": f"API 호출 오류 (상태 코드: {response.status_code})",
                    "response": response.text
                }

        except Exception as e:
            return {
                "status": "error",
                "error_message": str(e)
            }

    @staticmethod
    def text_to_speech(text, output_file_path, speaker="nara", speed=0):
        """
        텍스트를 음성으로 변환 (TTS)

        Args:
            text: 변환할 텍스트
            output_file_path: 저장할 파일 경로
            speaker: 화자 (기본값: "nara" - 한국어 여성)
            speed: 읽기 속도 (-5 ~ 5, 기본값: 0)

        Returns:
            결과 상태 및 정보
        """
        url = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"

        headers = {
            "X-NCP-APIGW-API-KEY-ID": os.getenv("NAVER_CLIENT_ID", "7hqv9mf01o"),
            "X-NCP-APIGW-API-KEY": os.getenv("NAVER_CLIENT_SECRET", "VpVXg9yfaBP7QliCnyKj8ikW7PT87k2bxiFDWA5z"),
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "speaker": speaker,
            "speed": speed,
            "text": text
        }

        try:
            response = requests.post(url, headers=headers, data=data)

            if response.status_code == 200:
                with open(output_file_path, 'wb') as f:
                    f.write(response.content)

                return {
                    "status": "success",
                    "message": "TTS가 성공적으로 생성되었습니다.",
                    "file_path": output_file_path
                }
            else:
                return {
                    "status": "error",
                    "error_message": f"API 호출 오류 (상태 코드: {response.status_code})",
                    "response": response.text
                }

        except Exception as e:
            return {
                "status": "error",
                "error_message": str(e)
            }

    @staticmethod
    def count_korean_syllables(text):
        """
        한글 텍스트의 음절 수 계산

        Args:
            text: 입력 텍스트

        Returns:
            음절 수
        """
        # 한글 음절만 필터링
        korean_text = ""
        for char in text:
            if '가' <= char <= '힣':  # 한글 유니코드 범위
                korean_text += char

        # 음절 수 반환
        return len(korean_text)


# 모듈이 직접 실행될 때만 실행되는 코드
if __name__ == "__main__":
    # 테스트 코드
    service = NaverClovaService()

    # 예시 음성 파일 경로 (실제 존재하는 파일로 변경 필요)
    audio_file_path = "test_audio.wav"

    # STT 테스트
    if os.path.exists(audio_file_path):
        result = service.speech_to_text(audio_file_path)
        print("STT 결과:", result)

        if result["status"] == "success":
            text = result["text"]
            syllable_count = service.count_korean_syllables(text)
            print(f"한글 음절 수: {syllable_count}")
    else:
        print(f"파일이 존재하지 않습니다: {audio_file_path}")
