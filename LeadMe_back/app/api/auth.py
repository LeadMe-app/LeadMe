# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from jose import JWTError, jwt
from typing import Optional, Dict
import random
import string
import time
import asyncio

# 내부 모듈 임포트
from database import get_db
import models
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from schemas.auth import Token, TokenData, UserLogin, \
    UserCreate, UserIdCheck, FindUserId, UserUpdate, ResetPasswordOnlyRequest, VerifyResetUserRequest

router = APIRouter()

# OAuth2 비밀번호 인증 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# 로그인 시도 추적을 위한 딕셔너리
login_attempts: Dict[str, Dict] = {}
LOCKOUT_DURATION = 30  # 잠금 시간 (초)
MAX_ATTEMPTS = 5  # 최대 시도 횟수


def check_login_attempts(user_id: str) -> None:
    """
    로그인 시도 횟수를 확인하고 필요한 경우 접근을 차단합니다.

    Args:
        user_id: 사용자 ID

    Raises:
        HTTPException: 로그인 시도 제한 초과 시
    """
    current_time = datetime.now()

    if user_id in login_attempts:
        user_data = login_attempts[user_id]

        # 잠금 시간이 지났는지 확인
        if user_data.get("lockout_until"):
            if current_time < user_data["lockout_until"]:
                remaining_time = (user_data["lockout_until"] - current_time).seconds
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"너무 많은 로그인 시도. {remaining_time}초 후에 다시 시도해주세요.",
                    headers={"Retry-After": str(remaining_time)}
                )
            else:
                # 잠금 시간이 지났으면 초기화
                login_attempts[user_id] = {"attempts": 0, "lockout_until": None}

        # 현재 시도 횟수 확인
        if user_data["attempts"] >= MAX_ATTEMPTS:
            # 잠금 시간 설정
            login_attempts[user_id]["lockout_until"] = current_time + timedelta(seconds=LOCKOUT_DURATION)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"너무 많은 로그인 시도. {LOCKOUT_DURATION}초 후에 다시 시도해주세요.",
                headers={"Retry-After": str(LOCKOUT_DURATION)}
            )
    else:
        login_attempts[user_id] = {"attempts": 0, "lockout_until": None}


def record_login_attempt(user_id: str, success: bool) -> None:
    """
    로그인 시도를 기록합니다.

    Args:
        user_id: 사용자 ID
        success: 로그인 성공 여부
    """
    if success:
        # 로그인 성공 시 기록 초기화
        if user_id in login_attempts:
            del login_attempts[user_id]
    else:
        # 로그인 실패 시 시도 횟수 증가
        if user_id not in login_attempts:
            login_attempts[user_id] = {"attempts": 0, "lockout_until": None}
        login_attempts[user_id]["attempts"] += 1


async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
) -> models.User:
    """
    현재 인증된 사용자를 가져옵니다.

    Args:
        token: JWT 토큰
        db: 데이터베이스 세션

    Returns:
        models.User: 인증된 사용자 모델

    Raises:
        HTTPException: 인증 실패 시 발생
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print("🔑 디코딩된 user_id:", user_id)

        token_data = TokenData(user_id=user_id)
    except JWTError as e:
        print("❌ JWT 디코딩 실패:", e)
        raise credentials_exception

    user = db.query(models.User).filter(models.User.user_id == token_data.user_id).first()
    print("👤 조회된 사용자:", user)

    if user is None:
        raise credentials_exception

    return user


def authenticate_user(db: Session, user_id: str, password: str) -> Optional[models.User]:
    """
    사용자 인증 함수

    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        password: 비밀번호

    Returns:
        Optional[models.User]: 인증 성공 시 사용자 모델, 실패 시 None
    """
    user = db.query(models.User).filter(models.User.user_id == user_id).first()

    if not user:
        return None

    if not verify_password(password, user.user_pw):
        return None

    return user


@router.post("/register", response_model=Token)
async def register(
        user_create: UserCreate,
        db: Session = Depends(get_db)
):
    """
    새로운 사용자를 등록합니다 (회원가입).

    Args:
        user_create: 사용자 생성 정보
        db: 데이터베이스 세션

    Returns:
        Token: 생성된 액세스 토큰
    """
    try:
        # 이미 존재하는 사용자 ID 확인
        if db.query(models.User).filter(models.User.user_id == user_create.user_id).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 사용자 ID입니다"
            )

        # 이미 존재하는 전화번호 확인
        if db.query(models.User).filter(models.User.phone_number == user_create.phone_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 전화번호입니다"
            )

        # 비밀번호 해싱
        hashed_password = get_password_hash(user_create.password)

        # 새 사용자 생성
        db_user = models.User(
            user_id=user_create.user_id,
            username=user_create.username,
            user_pw=hashed_password,
            phone_number=user_create.phone_number,
            age_group=user_create.age_group
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # 액세스 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            subject=db_user.user_id,
            expires_delta=access_token_expires
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        db.rollback()
        raise e


@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """
    사용자 로그인 및 토큰 발급

    Args:
        form_data: 로그인 폼 데이터 (username[user_id], password)
        db: 데이터베이스 세션

    Returns:
        Token: 액세스 토큰
    """
    # 로그인 시도 횟수 확인 
    user_id = form_data.username
    check_login_attempts(user_id)

    user = authenticate_user(db, user_id, form_data.password)

    if not user:
        # 로그인 실패 기록
        record_login_attempt(user_id, False)

        # 남은 시도 횟수 계산
        attempts_left = MAX_ATTEMPTS - login_attempts[user_id]["attempts"]

        if attempts_left > 0:
            detail_message = f"사용자 ID 또는 비밀번호가 올바르지 않습니다. (남은 시도: {attempts_left}회)"
        else:
            detail_message = f"로그인 시도 횟수를 초과했습니다. {LOCKOUT_DURATION}초 후에 다시 시도해주세요."

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_message,
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 로그인 성공 기록
    record_login_attempt(user_id, True)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.user_id,
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=TokenData)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 확인

    Args:
        current_user: 현재 로그인한 사용자

    Returns:
        TokenData: 사용자 ID
    """
    return TokenData(user_id=current_user.user_id)


@router.post("/check-userid")
async def check_user_id(
        user_id_check: UserIdCheck,
        db: Session = Depends(get_db)
):
    """
    사용자 ID 중복 확인

    Args:
        user_id_check: 확인할 사용자 ID
        db: 데이터베이스 세션

    Returns:
        Dict: 사용 가능 여부
    """
    db_user = db.query(models.User).filter(models.User.user_id == user_id_check.user_id).first()

    if db_user:
        return {"available": False, "message": "이미 사용 중인 사용자 ID입니다."}

    return {"available": True, "message": "사용 가능한 사용자 ID입니다."}


@router.post("/find-userid")
async def find_user_id(
        find_data: FindUserId,
        db: Session = Depends(get_db)
):
    """
    사용자명과 전화번호로 아이디 찾기

    Args:
        find_data: 사용자명과 전화번호 정보
        db: 데이터베이스 세션

    Returns:
        Dict: 찾은 사용자 ID 또는 오류 메시지
    """
    db_user = db.query(models.User).filter(
        models.User.username == find_data.username,
        models.User.phone_number == find_data.phone_number
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="입력한 사용자명과 전화번호가 일치하는 계정을 찾을 수 없습니다."
        )

    return {
        "status": "success",
        "message": "사용자 ID를 찾았습니다.",
        "user_id": db_user.user_id
    }


@router.post("/verify-reset-user")
async def verify_reset_user(
        verify_data: VerifyResetUserRequest,
        db: Session = Depends(get_db)
):
    """
    사용자 ID와 전화번호로 계정 존재 여부 확인

    Args:
        verify_data: 사용자 ID, 전화번호
        db: 데이터베이스 세션

    Returns:
        Dict: 결과 메시지
    """
    user = db.query(models.User).filter(
        models.User.user_id == verify_data.user_id,
        models.User.phone_number == verify_data.phone_number
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="입력한 사용자 ID와 전화번호가 일치하는 계정을 찾을 수 없습니다."
        )

    return {
        "status": "verified",
        "message": "사용자 정보가 확인되었습니다."
    }


@router.post("/reset-password")
async def reset_password(
        reset_data: ResetPasswordOnlyRequest,
        db: Session = Depends(get_db)
):
    """
    사용자 ID로 비밀번호 재설정

    Args:
        reset_data: 사용자 ID, 새 비밀번호
        db: 데이터베이스 세션

    Returns:
        Dict: 결과 메시지
    """
    user = db.query(models.User).filter(
        models.User.user_id == reset_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자 계정을 찾을 수 없습니다."
        )

    hashed_password = get_password_hash(reset_data.new_password)
    user.user_pw = hashed_password

    db.commit()

    return {
        "status": "success",
        "message": "비밀번호가 성공적으로 재설정되었습니다."
    }


@router.get("/login-attempts/{user_id}")
async def get_login_attempts(
        user_id: str,
        current_user: models.User = Depends(get_current_user)
):
    """
    특정 사용자의 로그인 시도 정보를 조회합니다. (관리자용)

    Args:
        user_id: 조회할 사용자 ID

    Returns:
        Dict: 로그인 시도 정보
    """
    if user_id in login_attempts:
        user_data = login_attempts[user_id]
        return {
            "user_id": user_id,
            "attempts": user_data["attempts"],
            "lockout_until": user_data["lockout_until"].isoformat() if user_data["lockout_until"] else None,
            "is_locked": user_data["lockout_until"] > datetime.now() if user_data["lockout_until"] else False
        }
    else:
        return {
            "user_id": user_id,
            "attempts": 0,
            "lockout_until": None,
            "is_locked": False
        }
