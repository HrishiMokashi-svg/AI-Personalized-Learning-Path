from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AccountUpdateIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=100)


class AccountDeleteIn(BaseModel):
    password: str


class ProfileIn(BaseModel):
    education_level: str = ""
    goal: str = ""
    interests: str = ""
    strengths: str = ""
    weaknesses: str = ""
    hobbies: str = ""
    learning_style: str = ""
    hours_per_week: int = Field(default=5, ge=1, le=80)


class ProgressIn(BaseModel):
    progress: int = Field(ge=0, le=100)


class AnswerIn(BaseModel):
    question_id: int
    selected: int


class QuizSubmitIn(BaseModel):
    topic: str
    answers: List[AnswerIn]


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class LessonCreateIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    duration: str = "15 min"
    video_url: str = Field(min_length=5, max_length=500)
    description: str = ""


class CourseCreateIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    level: str = "Beginner"
    tags: str = ""
    duration_hours: int = Field(default=10, ge=1, le=500)
    description: str = ""
    lessons: List[LessonCreateIn] = []
