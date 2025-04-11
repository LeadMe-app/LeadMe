# -*- coding: utf-8 -*-
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime

# 내부 모듈 임포트
from database import get_db
import models
from schemas.word import WordListCreate, WordListResponse, WordFavoriteCreate, WordFavoriteResponse

router = APIRouter()


@router.post("/", response_model=WordListResponse, status_code=status.HTTP_201_CREATED)
def create_word(
        word: WordListCreate,
        db: Session = Depends(get_db)
):
    """새로운 단어를 단어 목록에 추가합니다."""
    # 이미 존재하는 단어인지 확인
    db_word = db.query(models.WordList).filter(models.WordList.word == word.word).first()
    if db_word:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 단어입니다."
        )

    # 새 단어 생성
    db_word = models.WordList(
        word=word.word,
        image_url=word.image_url
    )

    db.add(db_word)
    db.commit()
    db.refresh(db_word)

    return db_word


@router.get("/", response_model=List[WordListResponse])
def read_words(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """모든 단어 목록을 반환합니다."""
    words = db.query(models.WordList).offset(skip).limit(limit).all()
    return words


@router.get("/{word_id}", response_model=WordListResponse)
def read_word(
        word_id: int,
        db: Session = Depends(get_db)
):
    """특정 단어의 정보를 반환합니다."""
    db_word = db.query(models.WordList).filter(models.WordList.word_id == word_id).first()
    if db_word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 단어를 찾을 수 없습니다."
        )
    return db_word


@router.put("/{word_id}", response_model=WordListResponse)
def update_word(
        word_id: int,
        word: WordListCreate,
        db: Session = Depends(get_db)
):
    """단어 정보를 업데이트합니다."""
    db_word = db.query(models.WordList).filter(models.WordList.word_id == word_id).first()
    if db_word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 단어를 찾을 수 없습니다."
        )

    # 업데이트할 데이터 설정
    for key, value in word.dict().items():
        setattr(db_word, key, value)

    db.commit()
    db.refresh(db_word)
    return db_word


@router.delete("/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_word(
        word_id: int,
        db: Session = Depends(get_db)
):
    """단어를 삭제합니다."""
    db_word = db.query(models.WordList).filter(models.WordList.word_id == word_id).first()
    if db_word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 단어를 찾을 수 없습니다."
        )

    db.delete(db_word)
    db.commit()
    return None


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


@router.get("/favorites/", response_model=List[WordFavoriteResponse])
def read_favorites(
        user_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """사용자의 즐겨찾기 단어 목록을 반환합니다."""
    query = db.query(models.WordFavorites)

    if user_id:
        query = query.filter(models.WordFavorites.user_id == user_id)

    favorites = query.offset(skip).limit(limit).all()
    return favorites


@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
        favorite_id: int,
        db: Session = Depends(get_db)
):
    """즐겨찾기에서 단어를 제거합니다."""
    db_favorite = db.query(models.WordFavorites).filter(models.WordFavorites.favorite_id == favorite_id).first()
    if db_favorite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 즐겨찾기를 찾을 수 없습니다."
        )

    db.delete(db_favorite)
    db.commit()
    return None