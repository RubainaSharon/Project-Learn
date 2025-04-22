from pydantic import BaseModel
from typing import List

class Question(BaseModel):
    type: str
    question: str
    options: List[str]
    correct_answer: str
    skill: str

class QuestionList(BaseModel):
    questions: List[Question]

class UserScoreCreate(BaseModel):
    username: str
    score: int
    skill: str

class UpdateProgress(BaseModel):
    username: str
    skill: str
    chapter_index: int
    completed: bool