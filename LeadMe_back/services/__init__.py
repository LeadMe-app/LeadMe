# services/__init__.py
from services.naver_clova import NaverClovaService
from services.opensmile import OpenSmileService
import os
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# NaverClova 서비스 초기화
naver_clova = NaverClovaService()

# OpenSMILE 서비스 초기화
opensmile = OpenSmileService()
