# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import random
from datetime import datetime
from sqlalchemy import func
from fastapi import Query

# 내부 모듈 임포트
from database import get_db
import models
from schemas.word import WordListCreate, WordListResponse, WordFavoriteCreate, WordFavoriteResponse

router = APIRouter()

'''단어 리스트 전체 제공'''
@router.get("/", response_model=List[WordListResponse])
def read_words(
        user_id: Optional[str] = None,  # ← user_id 쿼리 파라미터로 받음
        skip: int = 0,
        db: Session = Depends(get_db),
):
    """모든 단어 목록을 반환하며, user_id가 주어지면 즐겨찾기 여부도 포함합니다."""
    words = db.query(models.WordList).offset(skip).all()

    # 즐겨찾기 정보 미리 조회
    favorite_word_ids = set()
    if user_id:
        favorite_word_ids = set(
            db.scalars(
                db.query(models.WordFavorites.word_id)
                .filter(models.WordFavorites.user_id == user_id)
            ).all()
        )

    # is_favorite 포함한 응답 리스트 구성
    result = []
    for word in words:
        result.append({
            "word_id": word.word_id,
            "word": word.word,
            "image_url": word.image_url,
            "is_favorite": word.word_id in favorite_word_ids
        })

    return result

'''랜덤 단어 제공 (즐겨찾기 여부 포함)'''
@router.get("/random", response_model=WordListResponse)
def get_random_word(user_id: str, db: Session = Depends(get_db)):
    """무작위로 단어 하나를 반환하고, 즐겨찾기 상태도 함께 제공합니다."""
    
    random_word = db.query(models.WordList).order_by(func.random()).first()
    if random_word is None:
        raise HTTPException(status_code=404, detail="단어가 없습니다.")
    
    # 사용자의 즐겨찾기 여부 확인
    is_favorite = db.query(models.WordFavorites).filter(
        models.WordFavorites.user_id == user_id,
        models.WordFavorites.word_id == random_word.word_id
    ).first()

    return WordListResponse(
        word_id=random_word.word_id,
        word=random_word.word,
        image_url=random_word.image_url,
        is_favorite=bool(is_favorite)
    )


'''특정 단어 반환'''
@router.get("/{word_id}", response_model=WordListResponse)
def read_word(
        word_id: int,
        user_id: Optional[str] = None,  # ← user_id 쿼리로 받음
        db: Session = Depends(get_db)
):
    db_word = db.query(models.WordList).filter(models.WordList.word_id == word_id).first()
    if db_word is None:
        raise HTTPException(status_code=404, detail="해당 단어를 찾을 수 없습니다.")

    # 즐겨찾기 여부 확인
    is_favorite = False
    if user_id:
        is_favorite = db.query(models.WordFavorites).filter(
            models.WordFavorites.user_id == user_id,
            models.WordFavorites.word_id == word_id
        ).first() is not None

    # 딕셔너리로 직접 응답
    return {
        "word_id": db_word.word_id,
        "word": db_word.word,
        "image_url": db_word.image_url,
        "is_favorite": is_favorite
    }


'''
@router.post("/upload/image/")
async def upload_word_image(
        file: UploadFile = File(...),
        word: str = None
):
    """단어 이미지를 업로드합니다."""

    # 파일 확장자 검증
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="지원되지 않는 파일 형식입니다. .jpg, .jpeg, .png, .gif 형식만 허용됩니다."
        )

    # 업로드 디렉토리 경로
    UPLOAD_DIR = "uploads/images"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 파일명 생성 (단어 포함)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{word}_{timestamp}{os.path.splitext(file.filename)[1]}" if word else f"{timestamp}{os.path.splitext(file.filename)[1]}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 파일 저장
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # 향후 여기에 AWS S3 업로드 로직 추가 예정

    return {
        "filename": filename,
        "file_path": file_path,
        "image_url": f"/uploads/images/{filename}",
        "message": "이미지가 성공적으로 업로드되었습니다."
    }
'''

''' 즐겨찾기 추가'''
@router.post("/favorites/", response_model=WordFavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_word_to_favorites(
        favorite: WordFavoriteCreate,
        db: Session = Depends(get_db)
):
    """단어를 사용자의 즐겨찾기에 추가합니다."""
    # 사용자 존재 여부 확인
    db_user = db.query(models.User).filter(models.User.user_id == favorite.user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자를 찾을 수 없습니다."
        )

    # 단어 존재 여부 확인
    db_word = db.query(models.WordList).filter(models.WordList.word_id == favorite.word_id).first()
    if db_word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 단어를 찾을 수 없습니다."
        )

    # 이미 즐겨찾기에 있는지 확인
    db_favorite = db.query(models.WordFavorites).filter(
        models.WordFavorites.user_id == favorite.user_id,
        models.WordFavorites.word_id == favorite.word_id
    ).first()

    if db_favorite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 즐겨찾기에 등록된 단어입니다."
        )

    # 새 즐겨찾기 생성
    db_favorite = models.WordFavorites(
        user_id=favorite.user_id,
        word_id=favorite.word_id
    )

    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)

    return db_favorite


''' 즐겨찾기 리스트 조회'''
@router.get("/favorites/", response_model=List[WordFavoriteResponse])
def read_favorites(
        user_id: str = Query(..., description="사용자 ID는 필수입니다."),
        skip: int = 0,
        limit: int = 188,
        db: Session = Depends(get_db)
):
    """사용자의 즐겨찾기 단어 목록을 반환합니다."""
    query = db.query(models.WordFavorites)

    if user_id:
        query = query.filter(models.WordFavorites.user_id == user_id)

    favorites = query.offset(skip).limit(limit).all()
    return favorites


'''즐겨찾기 삭제'''
@router.delete("/favorites/", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
        user_id: str,  # 사용자 ID
        word_id: int,  # 단어 ID
        db: Session = Depends(get_db)
):
    """사용자의 즐겨찾기에서 단어를 제거합니다."""
    # 사용자와 단어에 대한 즐겨찾기 조회
    db_favorite = db.query(models.WordFavorites).filter(
        models.WordFavorites.user_id == user_id,
        models.WordFavorites.word_id == word_id
    ).first()

    # 즐겨찾기 항목이 없으면 에러 반환
    if db_favorite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 즐겨찾기를 찾을 수 없습니다."
        )

    # 즐겨찾기 삭제
    db.delete(db_favorite)
    db.commit()

    return None