# services/opensmile.py
class OpenSmileService:
    """더미 OpenSmile 서비스 클래스"""

    def __init__(self, opensmile_path=None, config_path=None):
        pass

    def analyze_speech_rate(self, audio_file_path):
        """기본적인 발화 속도 분석 결과 반환"""
        import librosa

        # 간단한 분석 수행
        y, sr = librosa.load(audio_file_path, sr=None)
        duration_seconds = librosa.get_duration(y=y, sr=sr)

        # 기본값 반환
        return {
            "status": "success",
            "duration_seconds": float(f"{duration_seconds:.2f}"),
            "spm": 200,  # 기본값
            "syllables_count": int(duration_seconds * 4.5)
        }

    def classify_speech_rate(self, spm, age_group="14세 이상"):
        """기본 발화 속도 분류"""
        return "정상"
