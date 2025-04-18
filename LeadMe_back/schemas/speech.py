# -*- coding: utf-8 -*-
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date


# 발화 세션 기본 모델
class SpeechSessionBase(BaseModel):
    user_id: str


# 발화 세션 생성 요청 모델
class SpeechSessionCreate(SpeechSessionBase):
    pass


# 발화 세션 응답 모델
class SpeechSessionResponse(SpeechSessionBase):
    session_id: int
    session_date: datetime

    class Config:
        orm_mode = True


# 발화 속도 분석 기본 모델
class SpeedAnalysisBase(BaseModel):
    user_id: str
    spm: int = Field(..., ge=0, description="발화 속도(SPM, Syllables Per Minute)")


# 발화 속도 분석 생성 요청 모델
class SpeedAnalysisCreate(SpeedAnalysisBase):
    pass


# 발화 속도 분석 응답 모델
class SpeedAnalysisResponse(SpeedAnalysisBase):
    analysis_id: int
    speed_category: str
    analysis_date: date

    class Config:
        orm_mode = True


# 연령대별 발화 속도 기준 모델
class AgeGroupSpeechRateBase(BaseModel):
    age_group: str = Field(..., description="사용자 연령대(7세 이하, 8~13세, 14세 이상)")
    slow_rate: int = Field(..., description="느린 발화 속도 기준(SPM)")
    normal_rate: int = Field(..., description="정상 발화 속도 기준(SPM)")
    fast_rate: int = Field(..., description="빠른 발화 속도 기준(SPM)")

    @validator('age_group')
    def validate_age_group(cls, v):
        valid_age_groups = ['7세 이하', '8~13세', '14세 이상']
        if v not in valid_age_groups:
            raise ValueError(f'유효한 연령대가 아닙니다. 가능한 값: {", ".join(valid_age_groups)}')
        return v


# 연령대별 발화 속도 기준 응답 모델
class AgeGroupSpeechRateResponse(AgeGroupSpeechRateBase):
    class Config:
        orm_mode = True