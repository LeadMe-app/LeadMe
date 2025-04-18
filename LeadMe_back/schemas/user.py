# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


# 기본 User 모델
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    phone_number: str = Field(..., min_length=10, max_length=15)
    age_group: str = Field(..., description="사용자 연령대(5~12세, 13~19세, 20세 이상)")

    @validator('age_group')
    def validate_age_group(cls, v):
        valid_age_groups = ['5~12세', '13~19세', '20세 이상']
        if v not in valid_age_groups:
            raise ValueError(f'유효한 연령대가 아닙니다. 가능한 값: {", ".join(valid_age_groups)}')
        return v


# 사용자 업데이트 요청 모델
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=15)
    age_group: Optional[str] = None

    @validator('age_group')
    def validate_age_group(cls, v):
        if v is not None:
            valid_age_groups = ['5~12세', '13~19세', '20세 이상']
            if v not in valid_age_groups:
                raise ValueError(f'유효한 연령대가 아닙니다. 가능한 값: {", ".join(valid_age_groups)}')
        return v


# 사용자 응답 모델 (비밀번호 제외)
class UserResponse(BaseModel):
    user_id: int
    username: str
    phone_number: str
    nickname: Optional[str] = None
    age_group: Optional[str] = None  # 예: '10대', '20대', '30대' 등

    class Config:
        orm_mode = True


# 사용자 상세 응답 모델
class UserDetail(UserResponse):
    pass


# 사용자 설정 기본 모델
class UserSettingsBase(BaseModel):
    user_id: int
    selected_speech_rate: int = Field(..., ge=100, le=300, description="선호하는 발화 속도(SPM)")


# 사용자 설정 생성 요청 모델
class UserSettingsCreate(BaseModel):
    selected_speech_rate: int = Field(..., ge=100, le=300, description="선호하는 발화 속도(SPM)")


# 사용자 설정 응답 모델
class UserSettingsResponse(UserSettingsBase):
    class Config:
        orm_mode = True