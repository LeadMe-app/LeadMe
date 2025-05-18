from openai import OpenAI
import os
from dotenv import load_dotenv

# .env 파일에서 API 키 로드 (보안을 위해 권장)
load_dotenv()

# API 키 가져오기
api_key = os.getenv("OPENAI_API_KEY")

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=api_key)

def transcribe_audio(audio_file_path):
    """
    OpenAI Whisper를 사용하여 오디오 파일을 텍스트로 변환
    """
    try:
        with open(audio_file_path, "rb") as audio_file:
            # OpenAI Whisper API 호출 (새로운 방식)
            response = client.audio.transcriptions.create(
                model="whisper-1",  # 사용할 모델
                file=audio_file,
                language="ko"  # 한국어 지정
            )
        
        # 결과 반환 (새로운 응답 형식)
        if hasattr(response, "text"):
            return {
                "status": "success",
                "text": response.text,
                "message": "음성이 성공적으로 텍스트로 변환되었습니다."
            }
        else:
            return {
                "status": "error",
                "error_message": "변환된 텍스트가 없습니다."
            }
    
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"STT 처리 중 오류가 발생했습니다: {str(e)}"
        }

# 사용 예시
if __name__ == "__main__":
    # 오디오 파일 경로 지정 (raw 문자열 사용)
    audio_file_path = r"C:\Users\ckswn\Downloads\output.mp3"  # 변환할 오디오 파일 경로
    
    # STT 실행
    result = transcribe_audio(audio_file_path)
    
    # 결과 출력
    if result["status"] == "success":
        print("변환 성공!")
        print(f"텍스트: {result['text']}")
    else:
        print(f"변환 실패: {result['error_message']}")
