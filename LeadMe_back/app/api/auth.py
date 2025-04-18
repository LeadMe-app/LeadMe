# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from typing import Optional
import random
import string

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
    UserCreate, UsernameCheck,  FindUserId, UserUpdate, ResetPasswordOnlyRequest, VerifyResetUserRequest

router = APIRouter()

# OAuth2 비밀번호 인증 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


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
    
        token_data = TokenData(user_id=int(user_id))
    except JWTError as e:
        print("❌ JWT 디코딩 실패:", e)
        raise credentials_exception

    user = db.query(models.User).filter(models.User.user_id == token_data.user_id).first()
    print("👤 조회된 사용자:", user)
    
    if user is None:
        raise credentials_exception

    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    사용자 인증 함수

    Args:
        db: 데이터베이스 세션
        username: 사용자명
        password: 비밀번호

    Returns:
        Optional[models.User]: 인증 성공 시 사용자 모델, 실패 시 None
    """
    user = db.query(models.User).filter(models.User.username == username).first()

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
        # 이미 존재하는 사용자명 확인
        if db.query(models.User).filter(models.User.username == user_create.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 사용자명입니다"
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
            username=user_create.username,
            user_pw=hashed_password,
            phone_number=user_create.phone_number,
            age_group=user_create.age_group,
            nickname=user_create.nickname
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
        form_data: 로그인 폼 데이터 (username, password)
        db: 데이터베이스 세션

    Returns:
        Token: 액세스 토큰
    """
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 올바르지 않습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

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


@router.post("/check-username")
async def check_username(
        username_check: UsernameCheck,
        db: Session = Depends(get_db)
):
    """
    사용자명 중복 확인

    Args:
        username_check: 확인할 사용자명
        db: 데이터베이스 세션

    Returns:
        Dict: 사용 가능 여부
    """
    db_user = db.query(models.User).filter(models.User.username == username_check.username).first()

    if db_user:
        return {"available": False, "message": "이미 사용 중인 사용자명입니다."}

    return {"available": True, "message": "사용 가능한 사용자명입니다."}


@router.post("/register", response_model=Token)
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


@router.post("/find-username")
async def find_username(
        find_data: FindUserId,
        db: Session = Depends(get_db)
):
    """
    사용자명과 전화번호로 아이디 찾기

    Args:
        find_data: 전화번호 정보
        db: 데이터베이스 세션

    Returns:
        Dict: 찾은 사용자명 또는 오류 메시지
    """
    db_user = db.query(models.User).filter(
        models.User.nickname == find_data.nickname,
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
        "username": db_user.username
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
        models.User.username == verify_data.username,
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
        models.User.username == reset_data.username
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
