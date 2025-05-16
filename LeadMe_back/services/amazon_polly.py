# -*- coding: utf-8 -*-
import boto3
import os
import asyncio
from dotenv import load_dotenv

# 내부 모듈 임포트
from services.age_based_speech_trainer import get_sentence_for_age_group

# 환경 변수 로드
load_dotenv()


class AmazonPollyService:
    """Amazon Polly를 사용한 TTS(Text-to-Speech) 서비스 클래스"""

    def __init__(self):
        """클래스 초기화"""
        # Amazon Polly 클라이언트 생성
        self.polly_client = boto3.client(
            'polly',
            region_name=os.getenv("AWS_REGION", "ap-northeast-2"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", ""),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "")
        )

        # 연령대별 속도 맵 정의
        self.age_group_speed_map = {
            '5~12세': {'천천히': 'x-slow', '중간': 'medium', '빠르게': 'fast'},
            '13~19세': {'천천히': 'slow', '중간': 'medium', '빠르게': 'x-fast'},
            '20세 이상': {'천천히': 'medium', '중간': 'fast', '빠르게': 'x-fast'}
        }

    async def get_sentence_based_on_age(self, age_group, custom_text=None):
        """
        연령대에 맞는 문장을 가져옵니다.
        custom_text가 제공되면 그것을 사용하고, 그렇지 않으면 age_based_speech_trainer에서 문장을 생성합니다.

        Args:
            age_group: 사용자 연령대 ('5~12세', '13~19세', '20세 이상')
            custom_text: 사용자가 직접 입력한 텍스트 (선택 사항)

        Returns:
            생성된 문장
        """
        if custom_text:
            return custom_text

        try:
            # age_based_speech_trainer에서 문장 생성
            sentence = await get_sentence_for_age_group(age_group)
            return sentence
        except Exception as e:
            print(f"문장 생성 오류: {e}")
            return "안녕하세요. 오늘은 날씨가 참 좋네요."  # 기본 문장 반환

    def text_to_speech(self, text, age_group, speed_label, output_dir="uploads/audio/tts", voice_id="Seoyeon"):
        """
        텍스트를 음성으로 변환하고 연령대와 속도 설정에 따라 조정합니다.

        Args:
            text: 변환할 텍스트
            age_group: 사용자 연령대 ('5~12세', '13~19세', '20세 이상')
            speed_label: 속도 레이블 ('천천히', '중간', '빠르게')
            output_dir: 출력 디렉토리 경로
            voice_id: 음성 ID (기본값: "Seoyeon" - 한국어 여성 음성)

        Returns:
            결과 상태 및 파일 경로를 포함한 딕셔너리
        """
        # 연령대와 속도 레이블에 따라 적절한 속도 값 결정
        speech_rate = self.age_group_speed_map.get(age_group, {}).get(speed_label, 'medium')

        # SSML 포맷으로 텍스트 구성 (속도 조절 포함)
        ssml_text = f"""
        <speak>
            <prosody rate="{speech_rate}">
                {text}
            </prosody>
        </speak>
        """

        try:
            # 디렉토리가 존재하지 않으면 생성
            os.makedirs(output_dir, exist_ok=True)

            # 파일명 생성
            import datetime
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            output_file = f"{output_dir}/tts_{timestamp}.mp3"

            # Amazon Polly로 음성 생성 (SSML 사용)
            response = self.polly_client.synthesize_speech(
                Text=ssml_text,
                TextType="ssml",
                OutputFormat="mp3",
                VoiceId=voice_id
            )

            # 오디오 파일로 저장
            if "AudioStream" in response:
                audio_stream = response['AudioStream'].read()
                with open(output_file, "wb") as file:
                    file.write(audio_stream)

                return {
                    "status": "success",
                    "file_path": output_file,
                    "file_url": f"/uploads/audio/tts/tts_{timestamp}.mp3",
                    "message": "텍스트가 성공적으로 음성으로 변환되었습니다."
                }
            else:
                return {
                    "status": "error",
                    "error_message": "AudioStream을 받지 못했습니다."
                }
        except Exception as e:
            return {
                "status": "error",
                "error_message": str(e)
            }