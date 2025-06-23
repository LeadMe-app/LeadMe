# -*- coding: utf-8 -*-
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, CheckConstraint, func
from sqlalchemy.orm import relationship
import datetime
from database import Base


# 1. Users (회원 정보 테이블)
class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String, index=True, nullable=False)
    user_pw = Column(String, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    age_group = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # CHECK 제약 조건 추가
    __table_args__ = (
        CheckConstraint("age_group IN ('5~12세', '13~19세', '20세 이상')", name="check_age_group"),
    )

    # 관계 설정
    speech_sessions = relationship("SpeechSession", back_populates="user")
    word_favorites = relationship("WordFavorites", back_populates="user", cascade="all, delete-orphan")
    speed_analyses = relationship("SpeedAnalysis", back_populates="user", cascade="all, delete-orphan")
    user_sessions = relationship(
        "UserSession", 
        back_populates="user",
        cascade="all, delete-orphan"
        )
    age_group_rate = relationship(
        "AgeGroupSpeechRate",
        primaryjoin="User.age_group == foreign(AgeGroupSpeechRate.age_group)",
        viewonly=True,
        uselist=False
    )


# 2. Word_List (단어 리스트 테이블)
class WordList(Base):
    __tablename__ = "word_list"

    word_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    word = Column(String(100), nullable=False)
    image_url = Column(Text, nullable=False)

    # 관계 설정
    word_favorites = relationship("WordFavorites", back_populates="word")


# 3. Word_Favorites (단어 즐겨찾기 테이블)
class WordFavorites(Base):
    __tablename__ = "word_favorites"

    favorite_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    word_id = Column(Integer, ForeignKey("word_list.word_id"), nullable=False)

    # 관계 설정
    user = relationship("User", back_populates="word_favorites")
    word = relationship("WordList", back_populates="word_favorites")


# 4. Speed_Analysis (발화 속도 분석 기록 테이블)
class SpeedAnalysis(Base):
    __tablename__ = "speed_analysis"

    analysis_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    spm = Column(Integer, nullable=False)
    speed_category = Column(String(20), nullable=False)
    analysis_date = Column(Date, nullable=False)

    # 관계 설정
    user = relationship("User", back_populates="speed_analyses")

# 5. Age_Group_Speech_Rate (연령대 별로 발화 속도 정의 테이블)
class AgeGroupSpeechRate(Base):
    __tablename__ = "age_group_speech_rate"

    age_group = Column(String, primary_key=True)
    slow_rate = Column(Integer)
    normal_rate = Column(Integer)
    fast_rate = Column(Integer)

    # CHECK 제약 조건 추가
    __table_args__ = (
        CheckConstraint("age_group IN ('5~12세', '13~19세', '20세 이상')", name="check_age_group_speech_rate"),
    )

# 6. user_sessions (로그인 세션 테이블)
class UserSession(Base):
    __tablename__ = "user_sessions" 

    user_id = Column(String, ForeignKey("users.user_id"), primary_key=True)
    token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 관계 설정
    user = relationship("User", back_populates="user_sessions")

# SpeechSession 클래스 추가 (Speech 세션 테이블)
class SpeechSession(Base):
    __tablename__ = "speech_sessions"

    session_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    session_date = Column(DateTime, default=datetime.datetime.utcnow)

    # 관계 설정
    user = relationship("User", back_populates="speech_sessions")