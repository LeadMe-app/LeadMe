# -*- coding: utf-8 -*-
import boto3
import os
import asyncio
import glob
from dotenv import load_dotenv
from datetime import datetime

# 내부 모듈 임포트
from services.word_based_speech_trainer import get_sentence_for_age_group

# 환경 변수 로드
load_dotenv()

class StutteringTTSService:
    """말더듬증 훈련용 TTS(Text-to-Speech)서비스 (항상 중간 속도)"""

    def __init__(self):
        # Amazon Polly 클라이언트 생성
        self.polly_client = boto3.client(
            'polly',
            region_name=os.getenv("AWS_REGION", "ap-northeast-2"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )

        # 출력 디렉토리 설정
        self.output_dir = "uploads/audio/stuttering"
        os.makedirs(self.output_dir, exist_ok=True)

    def text_to_speech(self, text, user_id="anonymous", voice_id="Seoyeon"):
        """
        텍스트를 음성으로 변환 (항상 medium 속도로 고정)

        Args:
            text (str): 변환할 텍스트
            user_id (str): 사용자 ID
            voice_id (str): Polly Voice ID

        Returns:
            dict: 결과 상태 및 파일 정보
        """
        # SSML 텍스트 (항상 중간 속도)
        ssml_text = f"""
        <speak>
            <prosody rate="medium">
                {text}
            </prosody>
        </speak>
        """

        # 파일 경로 설정
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_name = f"stuttering_tts_{user_id}_{timestamp}.mp3"
        output_file = os.path.join(self.output_dir, file_name)

        try:
            response = self.polly_client.synthesize_speech(
                Text=ssml_text,
                TextType="ssml",
                OutputFormat="mp3",
                VoiceId=voice_id
            )

            if "AudioStream" in response:
                with open(output_file, "wb") as file:
                    file.write(response["AudioStream"].read())

                return {
                    "status": "success",
                    "file_path": output_file,
                    "file_url": f"/uploads/audio/stuttering/{file_name}",
                    "message": "말더듬증 문장이 음성으로 변환되었습니다."
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