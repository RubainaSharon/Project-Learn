from sqlalchemy import Column, Integer, String, Date, JSON, DateTime, Float
from database import Base

class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)

class UserSkill(Base):
    __tablename__ = "user_skills"
    username = Column(String, primary_key=True)
    skill = Column(String, primary_key=True)
    score = Column(Integer)
    learning_journey = Column(JSON)
    progress = Column(Float, default=0.0)
    last_attempt_date = Column(Date)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)
    question = Column(String, index=True)
    options = Column(String)  # JSON string
    correct_answer = Column(String)
    skill = Column(String)

class ApiCall(Base):
    __tablename__ = "api_calls"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime)