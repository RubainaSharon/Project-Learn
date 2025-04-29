from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models  # Updated to relative import
from .schemas import QuestionList, UserScoreCreate, UpdateProgress, Question  # Updated to relative import
from pydantic import BaseModel
from typing import List
import requests
import json
from datetime import date, datetime
import re
import time
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://project-learn-tan.vercel.app/","http://localhost:3000","https://project-learn-qoief3um-learningapp.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize API constants
GEMINI_API_KEY = "AIzaSyDXFJ6vfjTj8EuTCKLMbGZrylPDkyvy4PY"  # Replace with your actual API key
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
headers = {"Content-Type": "application/json"}

# Helper functions
def has_taken_quiz_today(db: Session, username: str, skill: str):
    today = date.today()
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(username),
        models.UserSkill.skill.ilike(skill)
    ).first()
    return user_skill and user_skill.last_attempt_date == today

def get_api_calls_today(db: Session):
    today = date.today()
    count = db.query(models.ApiCall).filter(models.ApiCall.timestamp >= today).count()
    return count

def generate_and_store_journey(db: Session, username: str, skill: str, score: int):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            prompt = (
                f"Create a personalized learning journey for a {skill} learner with a quiz score of {score} out of 20. "
                f"Based on this score, determine their skill level (Beginner: 0-10, Intermediate: 11-15, Advanced: 16-20) "
                f"and create a 10-chapter learning journey tailored to their level. Each chapter must include: a chapter number, "
                f"a title, a brief description, specific topics, online resources (with URLs), a detailed script (at least 100 words) "
                f"with examples and explanations, and a summary of key takeaways. "
                f"**Return the response as a valid JSON object with the following structure:** "
                f"{{'level': 'string', 'chapters': [{{'chapter': number, 'title': 'string', 'description': 'string', 'topics': ['string'], "
                f"'resources': ['string'], 'script': 'string', 'summary': 'string'}}]}}. "
                f"Ensure the response is enclosed in triple backticks with the 'json' identifier, like this: ```json\n{{...}}\n```."
            )

            data = {"contents": [{"parts": [{"text": prompt}]}]}
            try:
                response = requests.post(GEMINI_URL, headers=headers, json=data, timeout=30)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                logger.error(f"API request failed: {e}")
                raise

            # Log the raw response
            logger.info(f"Raw API Response: {response.text}")

            try:
                response_json = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON from API response: {e}")
                logger.error(f"Raw API Response: {response.text}")
                raise

            if "candidates" not in response_json or not response_json["candidates"]:
                logger.error(f"Invalid API response - Missing candidates: {response_json}")
                raise ValueError("Invalid API response: Missing 'candidates'")

            if "content" not in response_json["candidates"][0] or "parts" not in response_json["candidates"][0]["content"]:
                logger.error(f"Invalid API response - Missing content or parts: {response_json}")
                raise ValueError("Invalid API response: Missing 'content' or 'parts'")

            journey_text = response_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            logger.debug(f"Raw Journey text: {journey_text}")

            # Try to find JSON within code blocks (with optional language specifier like ```json)
            json_match = re.search(r'```(?:json)?\s*\n([\s\S]*?)\n```', journey_text, re.DOTALL)
            if json_match:
                journey_text = json_match.group(1).strip()
                logger.debug(f"Extracted JSON text from code block: {journey_text}")
            else:
                # If no code block, try to extract raw JSON
                journey_text = journey_text.strip()
                if journey_text.startswith('{') and journey_text.endswith('}'):
                    logger.debug(f"Using raw JSON text: {journey_text}")
                else:
                    # Try to find a JSON-like substring
                    start = journey_text.find('{')
                    end = journey_text.rfind('}') + 1
                    if start != -1 and end != 0:
                        journey_text = journey_text[start:end]
                        logger.debug(f"Extracted potential JSON substring: {journey_text}")
                    else:
                        logger.error(f"No valid JSON found in response: {journey_text}")
                        raise ValueError("No valid JSON found")

            # Parse the extracted text as JSON
            try:
                journey = json.loads(journey_text)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to load JSON: {e}, raw text: {journey_text}")
                raise

            for chapter in journey["chapters"]:
                chapter["completed"] = False

            api_call = models.ApiCall(timestamp=datetime.now())
            db.add(api_call)
            db.commit()

            # Log the generated chapters
            chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
            logger.info(f"Generated journey chapters: {chapter_numbers}")

            return journey
        except Exception as e:
            logger.exception(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            # If all attempts fail, return a placeholder journey
            level = "Beginner" if score <= 10 else "Intermediate" if score <= 15 else "Advanced"
            journey = {
                "level": level,
                "chapters": [
                    {
                        "chapter": i + 1,
                        "title": f"{skill} Chapter {i + 1}",
                        "description": f"Learn key concepts of {skill}.",
                        "topics": ["Basics"],
                        "resources": ["https://example.com"],
                        "script": f"This is a placeholder script due to API failure: {str(e)}",
                        "summary": "Key takeaways.",
                        "completed": False
                    } for i in range(10)
                ]
            }
            # Log the placeholder chapters
            chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
            logger.info(f"Generated placeholder journey chapters: {chapter_numbers}")
            return journey

def generate_next_chapter(db: Session, username: str, skill: str, current_chapter: int):
    logger.info(f"Starting generate_next_chapter for username={username}, skill={skill}, chapter={current_chapter}")
    max_retries = 3
    for attempt in range(max_retries):
        try:
            user_skill = db.query(models.UserSkill).filter(
                models.UserSkill.username.ilike(username),
                models.UserSkill.skill.ilike(skill)
            ).first()
            if not user_skill or not user_skill.learning_journey:
                raise HTTPException(status_code=404, detail="No learning journey found")

            journey = user_skill.learning_journey
            if current_chapter >= len(journey["chapters"]) or current_chapter < 0:
                raise HTTPException(status_code=400, detail="Invalid chapter index")

            if journey["chapters"][current_chapter]["completed"]:
                raise HTTPException(status_code=400, detail="Chapter already completed")

            if current_chapter + 1 >= len(journey["chapters"]):
                raise HTTPException(status_code=400, detail="No more chapters to generate")

            next_chapter_idx = current_chapter + 1
            # Log the current state of chapters before proceeding
            chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
            logger.info(f"Chapters before generating next: {chapter_numbers}")

            # Since the journey already has 10 chapters, return the existing next chapter
            next_chapter = journey["chapters"][next_chapter_idx]
            logger.info(f"Returning existing chapter {next_chapter['chapter']}: {next_chapter['title']}")
            return next_chapter
        except Exception as e:
            logger.exception(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise HTTPException(status_code=500, detail="Failed to generate next chapter. Please try again later.")

# Endpoints
@app.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username.ilike(username)).first()
    return {"exists": bool(user)}

@app.get("/can-take-quiz/{username}/{skill}")
def can_take_quiz(username: str, skill: str, db: Session = Depends(get_db)):
    if has_taken_quiz_today(db, username, skill):
        return {"can_take": False, "message": "You have already taken the quiz for this skill today. Taking it again will overwrite your previous learning journey."}
    if get_api_calls_today(db) >= 200:
        return {"can_take": False, "message": "Sorry we are a growing website with low budget implementation hence we are using a free tier AI for this website. And so the limit of taking the number of quiz per day is 200. Unfortunately you are the 201th member. But I request you to come back tomorrow to try our website again. Thank you <3"}
    return {"can_take": True}

@app.post("/submit-score")
def submit_score(score_data: UserScoreCreate, db: Session = Depends(get_db)):
    username = score_data.username
    skill = score_data.skill
    score = score_data.score
    today = date.today()
    user = db.query(models.User).filter(models.User.username.ilike(username)).first()
    if not user:
        db.add(models.User(username=username))
        db.commit()
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(username),
        models.UserSkill.skill.ilike(skill)
    ).first()
    journey = generate_and_store_journey(db, username, skill, score)
    if user_skill:
        # Update existing record
        user_skill.score = score
        user_skill.learning_journey = journey
        user_skill.progress = 0.0
        user_skill.last_attempt_date = today
    else:
        # Create new record
        user_skill = models.UserSkill(
            username=username,
            skill=skill,
            score=score,
            learning_journey=journey,
            progress=0.0,
            last_attempt_date=today
        )
        db.add(user_skill)
    db.commit()
    return {"message": "Score and journey updated", "journey": journey}

@app.get("/user-data/{username}")
def get_user_data(username: str, db: Session = Depends(get_db)):
    user_skills = db.query(models.UserSkill).filter(models.UserSkill.username.ilike(username)).all()
    skills_data = [
        {
            "skill": skill.skill,
            "score": skill.score,
            "learning_journey": skill.learning_journey,
            "progress": skill.progress,
            "last_attempt_date": skill.last_attempt_date
        } for skill in user_skills
    ]
    return {"skills": skills_data}

@app.post("/update-progress")
def update_progress(data: UpdateProgress, db: Session = Depends(get_db)):
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(data.username),
        models.UserSkill.skill.ilike(data.skill)
    ).first()
    if not user_skill:
        raise HTTPException(status_code=404, detail="User skill not found")
    journey = user_skill.learning_journey
    if 0 <= data.chapter_index < len(journey["chapters"]):
        journey["chapters"][data.chapter_index]["completed"] = data.completed
        completed_count = sum(1 for ch in journey["chapters"] if ch["completed"])
        user_skill.progress = (completed_count / len(journey["chapters"])) * 100
        user_skill.learning_journey = journey
        db.commit()
        return {"message": "Progress updated"}
    raise HTTPException(status_code=400, detail="Invalid chapter index")

@app.get("/questions/{skill}")
def get_questions(skill: str, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.skill.ilike(skill)).all()
    result = []
    for q in questions:
        try:
            options = json.loads(q.options)
            result.append({
                "type": q.type,
                "question": q.question,
                "options": options,
                "correct_answer": q.correct_answer,
                "skill": q.skill
            })
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in question ID {q.id}: {q.options}, error: {e}")
            raise HTTPException(status_code=500, detail=f"Invalid JSON in question data: {q.id}")
    return result

@app.get("/questions")
def get_all_questions(db: Session = Depends(get_db)):
    questions = db.query(models.Question).all()
    result = []
    for q in questions:
        try:
            options = json.loads(q.options)
            result.append({
                "type": q.type,
                "question": q.question,
                "options": options,
                "correct_answer": q.correct_answer,
                "skill": q.skill
            })
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in question ID {q.id}: {q.options}, error: {e}")
            raise HTTPException(status_code=500, detail=f"Invalid JSON in question data: {q.id}")
    return result

@app.post("/questions")
def add_questions(questions: List[Question], db: Session = Depends(get_db)):
    for question in questions:
        options_json = json.dumps(question.options)
        db_question = models.Question(
            type=question.type,
            question=question.question,
            options=options_json,
            correct_answer=question.correct_answer,
            skill=question.skill
        )
        db.add(db_question)
    db.commit()
    return {"message": f"Successfully added {len(questions)} questions"}

# Endpoint: Get available skills
@app.get("/available-skills")
def get_available_skills(db: Session = Depends(get_db)):
    skills = db.query(models.Question.skill).distinct().all()
    return {"skills": [skill[0] for skill in skills]}

# Endpoint: Generate next chapter
@app.get("/generate-next-chapter")
def generate_next_chapter_endpoint(username: str, skill: str, current_chapter: int, db: Session = Depends(get_db)):
    return generate_next_chapter(db, username, skill, current_chapter)
    
@app.get("/")
def read_root():
    return {"message": "Welcome to Project Learn API! Use /docs for API documentation."}
