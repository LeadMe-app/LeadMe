# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field, validator
from typing import Optional


class Token(BaseModel):
    """
    토큰 응답 모델
    """
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """
    토큰 데이터 모델
    """
    user_id: Optional[str] = None  # String으로 변경


class UserLogin(BaseModel):
    """
    사용자 로그인 요청 모델
    """
    user_id: str  # user_id로 로그인
    password: str


class UserCreate(BaseModel):
    """
    사용자 회원가입 요청 모델
    """
    user_id: str = Field(..., min_length=3, max_length=50)  # 사용자가 입력하는 ID
    username: str = Field(..., min_length=2, max_length=50)  # 사용자 이름/닉네임
    password: str = Field(..., min_length=8)
    password_confirm: str = Field(..., min_length=8)
    phone_number: str = Field(..., min_length=10, max_length=15)
    age_group: str = Field(..., description="사용자 연령대(7세 이하, 8~13세, 14세 이상)")

    @validator('password_confirm')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('비밀번호가 일치하지 않습니다')
        return v

    class Config:
        schema_extra = {
            "example": {
                "user_id": "user123",
                "username": "홍길동",
                "password": "securepassword",
                "password_confirm": "securepassword",
                "phone_number": "01012345678",
                "age_group": "14세 이상"
            }
        }


class UserIdCheck(BaseModel):
    """
    사용자 ID 중복 확인 요청 모델
    """
    user_id: str = Field(..., min_length=3, max_length=50)


class FindUserId(BaseModel):
    """
    아이디 찾기 요청 모델
    """
    username: str = Field(..., min_length=2, max_length=50, description="사용자 이름")
    phone_number: str = Field(..., min_length=10, max_length=15)


class UserUpdate(BaseModel):
    username: Optional[str] = None
    phone_number: Optional[str] = None
    user_pw: Optional[str] = Field(None, alias="password")


class ResetPasswordOnlyRequest(BaseModel):
    user_id: str
    new_password: str


class VerifyResetUserRequest(BaseModel):
    user_id: str
    phone_number: str