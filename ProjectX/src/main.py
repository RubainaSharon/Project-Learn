from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
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

# Optimize SQLAlchemy engine for Render
# Ensure the connection pool can handle dropped connections
engine.dispose()  # Close any existing connections
from sqlalchemy import create_engine
# Reconfigure the engine with connection pool settings
engine = create_engine(
    engine.url,  # Reuse the existing URL from the imported engine
    pool_size=5,  # Small pool size for Render's free tier
    max_overflow=10,  # Allow some overflow connections
    pool_timeout=30,  # Wait 30 seconds for a connection
    pool_pre_ping=True,  # Check connection health before using it
)

# Log connection pool stats on startup
logger.info(f"Connection pool initialized: {engine.pool.status()}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    max_retries = 3
    for attempt in range(max_retries):
        try:
            user_skill = db.query(models.UserSkill).filter(
                models.UserSkill.username.ilike(username),
                models.UserSkill.skill.ilike(skill)
            ).first()
            return user_skill and user_skill.last_attempt_date == today
        except OperationalError as e:
            logger.warning(f"Database connection error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                db.rollback()
                continue
            logger.error(f"All retry attempts failed for has_taken_quiz_today: {e}")
            raise HTTPException(status_code=503, detail="Database connection failed. Please try again later.")

def get_api_calls_today(db: Session):
    today = date.today()
    count = db.query(models.ApiCall).filter(models.ApiCall.timestamp >= today).count()
    return count

def generate_and_store_journey(db: Session, username: str, skill: str, score: int):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Primary prompt with 10 chapters and 100-word scripts
            prompt = (
                f"Create a personalized learning journey for a {skill} learner with a quiz score of {score} out of 20. "
                f"Based on this score, determine their skill level (Beginner: 0-10, Intermediate: 11-15, Advanced: 16-20) "
                f"and create a 10-chapter learning journey tailored to their level. Each chapter must include: a chapter number, "
                f"a title, a brief description (1-2 sentences), specific topics (5-7 topics as a list), online resources (3-5 valid, working URLs from reputable sources like Microsoft, Google, or freeCodeCamp, aligning with current industry practices), "
                f"a detailed script (at least 100 words) with practical real-world examples (e.g., 'In a retail company like Walmart, this SQL query might be used to track inventory...', 'At a tech company like Google, this Python script might analyze user data...', or 'In a healthcare setting like Mayo Clinic, this algorithm might predict patient outcomes...'), "
                f"ensuring examples vary across chapters by using different industries or scenarios (e.g., retail, tech, healthcare, finance, education) for each chapter, "
                f"a varied teaching style to avoid monotony (e.g., use storytelling, analogies, scenarios, or a conversational tone instead of standard explanations), "
                f"and clear spacing between concepts (use '\\n\\n' to separate each major idea for readability within the JSON string), and a summary of key takeaways (2-3 sentences). "
                f"For Chapter 1 only: The script must begin with the exact line 'If you were wondering, yes, it was Gojo Satoru in the background image of the quiz page.' followed by '\\n\\n'. "
                f"Then, include a statement specifying the type of journey created based on the score, e.g., 'This is a Beginner to Intermediate journey,' 'This is an Intermediate to Advanced journey,' or 'This is an Advanced journey,' followed by the rest of the script content. "
                f"**Return the response as a valid JSON object with the following structure:** "
                f"{{'level': 'string', 'chapters': [{{'chapter': number, 'title': 'string', 'description': 'string', 'topics': ['string'], "
                f"'resources': ['string'], 'script': 'string', 'summary': 'string'}}]}}. "
                f"Ensure the response is enclosed in triple backticks with the 'json' identifier, like this: ```json\n{{...}}\n```."
            )

            data = {"contents": [{"parts": [{"text": prompt}]}]}
            logger.info(f"Attempt {attempt + 1}: Making API request to {GEMINI_URL} with headers: {headers}")
            response = requests.post(GEMINI_URL, headers=headers, json=data, timeout=90)  # Increased timeout to 90 seconds
            response.raise_for_status()

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

            # Try to find JSON within code blocks
            json_match = re.search(r'```(?:json)?\s*\n([\s\S]*?)\n```', journey_text, re.DOTALL)
            if json_match:
                journey_text = json_match.group(1).strip()
                logger.debug(f"Extracted JSON text from code block: {journey_text}")
            else:
                journey_text = journey_text.strip()
                if journey_text.startswith('{') and journey_text.endswith('}'):
                    logger.debug(f"Using raw JSON text: {journey_text}")
                else:
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

            chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
            logger.info(f"Generated journey chapters: {chapter_numbers}")
            return journey

        except Exception as e:
            logger.exception(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 * (2 ** attempt))
                continue

            # Fallback: Retry with a smaller prompt (3 chapters, 50-word scripts)
            logger.info("Falling back to a smaller prompt due to repeated failures.")
            try:
                fallback_prompt = (
                    f"Create a personalized learning journey for a {skill} learner with a quiz score of {score} out of 20. "
                    f"Based on this score, determine their skill level (Beginner: 0-10, Intermediate: 11-15, Advanced: 16-20) "
                    f"and create a 3-chapter learning journey tailored to their level. Each chapter must include: a chapter number, "
                    f"a title, a brief description (1-2 sentences), specific topics (3-5 topics as a list), online resources (2-3 valid URLs), "
                    f"a detailed script (at least 50 words) with practical examples, and a summary of key takeaways (1-2 sentences). "
                    f"For Chapter 1 only: The script must begin with the exact line 'If you were wondering, yes, it was Gojo Satoru in the background image of the quiz page.' followed by '\\n\\n'. "
                    f"Then, include a statement specifying the type of journey created based on the score. "
                    f"**Return the response as a valid JSON object with the following structure:** "
                    f"{{'level': 'string', 'chapters': [{{'chapter': number, 'title': 'string', 'description': 'string', 'topics': ['string'], "
                    f"'resources': ['string'], 'script': 'string', 'summary': 'string'}}]}}. "
                    f"Ensure the response is enclosed in triple backticks with the 'json' identifier."
                )

                data = {"contents": [{"parts": [{"text": fallback_prompt}]}]}
                logger.info(f"Fallback: Making API request to {GEMINI_URL} with headers: {headers}")
                response = requests.post(GEMINI_URL, headers=headers, json=data, timeout=90)
                response.raise_for_status()

                response_json = response.json()
                journey_text = response_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                json_match = re.search(r'```(?:json)?\s*\n([\s\S]*?)\n```', journey_text, re.DOTALL)
                if json_match:
                    journey_text = json_match.group(1).strip()

                journey = json.loads(journey_text)
                # Extend to 10 chapters by duplicating the 3 chapters
                chapters = journey["chapters"]
                extended_chapters = []
                for i in range(10):
                    chapter = chapters[i % 3].copy()
                    chapter["chapter"] = i + 1
                    chapter["completed"] = False
                    extended_chapters.append(chapter)
                journey["chapters"] = extended_chapters

                api_call = models.ApiCall(timestamp=datetime.now())
                db.add(api_call)
                db.commit()

                chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
                logger.info(f"Generated fallback journey chapters: {chapter_numbers}")
                return journey

            except Exception as e:
                logger.exception(f"Fallback attempt failed: {e}")
                # Final fallback: Placeholder journey
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
                            "script": "We couldn’t generate your learning journey due to a network issue. Please check your internet connection and try again later, or contact support if the problem persists.",
                            "summary": "Key takeaways will be available once the journey is generated.",
                            "completed": False
                        } for i in range(10)
                    ]
                }
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
            chapter_numbers = [ch["chapter"] for ch in journey["chapters"]]
            logger.info(f"Chapters before generating next: {chapter_numbers}")

            next_chapter = journey["chapters"][next_chapter_idx]
            logger.info(f"Returning existing chapter {next_chapter['chapter']}: {next_chapter['title']}")
            return next_chapter
        except Exception as e:
            logger.exception(f"Attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 * (2 ** attempt))
                continue
            raise HTTPException(status_code=500, detail="Failed to generate next chapter. Please try again later.")

# Endpoints
@app.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            logger.info(f"Checking username: {username}, attempt {attempt + 1}")
            user = db.query(models.User).filter(models.User.username.ilike(username)).first()
            return {"exists": bool(user)}
        except OperationalError as e:
            logger.warning(f"Database connection error in check_username on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                db.rollback()
                continue
            logger.error(f"All retry attempts failed for check_username: {e}")
            raise HTTPException(status_code=503, detail="Database connection failed. Please try again later.")

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
        user = models.User(username=username)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    user_skill = db.query(models.UserSkill).filter(
        models.UserSkill.username.ilike(username),
        models.UserSkill.skill.ilike(skill)
    ).first()
    journey = generate_and_store_journey(db, username, skill, score)
    if user_skill:
        user_skill.score = score
        user_skill.learning_journey = journey
        user_skill.progress = 0.0
        user_skill.last_attempt_date = today
    else:
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
    db.refresh(user_skill)
    
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

@app.get("/available-skills")
def get_available_skills(db: Session = Depends(get_db)):
    skills = db.query(models.Question.skill).distinct().all()
    return {"skills": [skill[0] for skill in skills]}

@app.get("/generate-next-chapter")
def generate_next_chapter_endpoint(username: str, skill: str, current_chapter: int, db: Session = Depends(get_db)):
    return generate_next_chapter(db, username, skill, current_chapter)

@app.get("/warm-up")
def warm_up(db: Session = Depends(get_db)):
    try:
        # Lightweight database query to warm up the connection
        db.query(models.User).limit(1).all()
        logger.info("Database connection warmed up successfully.")
        
        # Test Gemini API with a small request
        test_prompt = "Generate a simple response: Hello, this is a test."
        data = {"contents": [{"parts": [{"text": test_prompt}]}]}
        response = requests.post(GEMINI_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        logger.info("Gemini API warmed up successfully.")
        
        return {"status": "Warm-up successful"}
    except Exception as e:
        logger.error(f"Warm-up failed: {e}")
        return {"status": "Warm-up failed", "error": str(e)}

@app.get("/")
def read_root():
    return {"message": "Welcome to Project Learn API! Use /docs for API documentation."}
