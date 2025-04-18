# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import jwt
from passlib.context import CryptContext

# 비밀번호 해싱 컨텍스트 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 토큰 관련 설정
SECRET_KEY = "YOUR_SECRET_KEY_HERE_CHANGE_THIS_IN_PRODUCTION"  # 실제 배포 시 변경 필요
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 토큰 만료 시간: 30분


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해시된 비밀번호를 비교하여 검증합니다.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    비밀번호를 해시화합니다.
    """
    return pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    액세스 토큰을 생성합니다.

    Args:
        subject: 토큰에 포함될 주체 (일반적으로 사용자 ID)
        expires_delta: 토큰 만료 시간 (None인 경우 기본값 사용)

    Returns:
        str: 생성된 JWT 토큰
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt