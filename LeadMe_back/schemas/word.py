# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List


# 단어 목록 기본 모델
class WordListBase(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)
    image_url: str = Field(..., description="단어를 설명하는 이미지의 URL")


# 단어 생성 요청 모델
class WordListCreate(WordListBase):
    pass


# 단어 응답 모델
class WordListResponse(WordListBase):
    word_id: int
    is_favorite: bool = False  
    
    class Config:
        orm_mode = True


# 단어 즐겨찾기 기본 모델
class WordFavoriteBase(BaseModel):
    user_id: str
    word_id: int


# 단어 즐겨찾기 생성 요청 모델
class WordFavoriteCreate(WordFavoriteBase):
    pass


# 단어 즐겨찾기 응답 모델
class WordFavoriteResponse(WordFavoriteBase):
    favorite_id: int

    class Config:
        orm_mode = True


# 단어 즐겨찾기 상세 응답 모델 (단어 정보 포함)
class WordFavoriteDetailResponse(BaseModel):
    favorite_id: int
    user_id: str
    word: WordListResponse

    class Config:
        orm_mode = True