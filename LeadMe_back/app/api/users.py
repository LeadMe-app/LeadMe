# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# 내부 모듈 임포트
from database import get_db
import models
from schemas.user import UserResponse, UserUpdate, UserDetail
from app.api.auth import get_current_user
from app.api.auth import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def read_users(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """모든 사용자 목록을 반환합니다."""
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users


@router.get("/me", response_model=UserDetail)
def read_user_me(current_user: models.User = Depends(get_current_user)):
    """현재 로그인한 사용자의 상세 정보를 반환합니다."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
        user_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """특정 사용자의 정보를 반환합니다."""
    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )
    return db_user



@router.put("/me", response_model=UserResponse)
def update_user_me(
        user: UserUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    for key, value in user.dict(exclude_unset=True, by_alias=True).items():
        if key == "user_pw":
            hashed_pw = get_password_hash(value)
            setattr(current_user, "user_pw", hashed_pw)
        else:
            setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
        user_id: str,
        user: UserUpdate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """사용자 정보를 업데이트합니다."""
    # 관리자 권한 확인 필요 (이 예제에서는 생략)

    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )

    # 업데이트할 데이터 설정
    for key, value in user.dict(exclude_unset=True).items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
        user_id: str,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """사용자를 삭제합니다."""
    # 관리자 권한 확인 필요 (이 예제에서는 생략)

    db_user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )

    db.delete(db_user)
    db.commit()
    return None