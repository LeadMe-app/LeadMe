import openai
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("openai_stt")


class OpenAISTTService:
    """OpenAI Whisper API를 사용하여 STT(Speech-to-Text) 기능을 제공하는 서비스 클래스"""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        openai.api_key = self.api_key  # ✅ 고전 방식에선 전역 설정

    def speech_to_text(self, file_path: str):
        try:
            with open(file_path, "rb") as audio_file:
                logger.info("오디오 파일 열기 성공: %s", file_path)
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file
                )
            return {"status": "success", "text": transcript["text"]}
        except Exception as e:
            logger.error("STT 처리 중 오류 발생: %s", e)
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