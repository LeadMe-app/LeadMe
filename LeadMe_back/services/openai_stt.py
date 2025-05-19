import openai
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("openai_stt")


class OpenAISTTService:
    """OpenAI Whisper API를 사용하여 STT(Speech-to-Text) 기능을 제공하는 서비스 클래스"""

    def __init__(self):
        openai.api_key = os.getenv("OPENAI_API_KEY")

    def speech_to_text(self, file_path):
        """
        음성 파일을 텍스트로 변환 (STT)

        Args:
            file_path: 음성 파일 경로

        Returns:
            변환된 텍스트 및 결과 정보
        """
        try:
            with open(file_path, "rb") as audio_file:
                # OpenAI Whisper API 호출
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="ko"  # 한국어 지정
                )

            # 결과 반환
            return {
                "status": "success",
                "text": response.text,
                "message": "음성이 성공적으로 텍스트로 변환되었습니다."
            }

        except Exception as e:
            logger.error(f"STT 처리 중 오류 발생: {str(e)}")
            return {
                "status": "error",
                "error_message": f"음성을 텍스트로 변환하는 중 오류가 발생했습니다: {str(e)}"
            }

    def count_korean_syllables(self, text):
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