import os
import re
from collections import defaultdict

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import api_calling
import rag
from auth import create_token, current_user, hash_password, verify_password
from database import Base, SessionLocal, engine, get_db
from models import (Course, Enrollment, LearningPath, QuizQuestion,
                    QuizResult, StudentProfile, User)
from schemas import (AccountDeleteIn, AccountUpdateIn, ChatIn, LoginIn,
                     PasswordChangeIn, ProfileIn, ProgressIn, QuizSubmitIn,
                     RegisterIn)
from seed import seed

app = FastAPI(title="LearnAI - AI Personalized Learning Path API")

# Configure CORS origins
cors_env = os.getenv("CORS_ORIGINS", "").strip()
allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else []
dev_origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
for o in dev_origins:
    if o not in allowed_origins:
        allowed_origins.append(o)

if cors_env == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"^https?:\/\/(.*\.vercel\.app|.*\.onrender\.com|.*\.railway\.app|localhost.*|127\.0\.0\.1.*)$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed(db)
        try:
            print("RAG ingest:", rag.ingest_kb(db))
        except Exception as e:  # app still works without the API key
            print("RAG ingest skipped:", e)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "LearnAI API is running", "docs": "/docs", "health": "/health"}


api_router = APIRouter()


@api_router.get("/health")
def health():
    return {"status": "ok"}


# ---------------- AUTH ----------------
@api_router.post("/auth/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    user = User(name=data.name.strip(), email=data.email.lower(), password_hash=hash_password(data.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Email already registered")
    db.add(StudentProfile(user_id=user.id))
    db.commit()
    return {"token": create_token(user.id), "user": {"id": user.id, "name": user.name, "email": user.email}}


@api_router.post("/auth/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_token(user.id), "user": {"id": user.id, "name": user.name, "email": user.email}}


@api_router.put("/account")
def update_account(data: AccountUpdateIn, user: User = Depends(current_user),
                   db: Session = Depends(get_db)):
    name = data.name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Name must contain at least 2 characters")
    user.name = name
    user.email = data.email.lower()
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Email already registered")
    return {"id": user.id, "name": user.name, "email": user.email}


@api_router.put("/account/password")
def change_password(data: PasswordChangeIn, user: User = Depends(current_user),
                    db: Session = Depends(get_db)):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated"}


@api_router.delete("/account")
def delete_account(data: AccountDeleteIn, user: User = Depends(current_user),
                   db: Session = Depends(get_db)):
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(400, "Password is incorrect")
    for model in (LearningPath, QuizResult, Enrollment, StudentProfile):
        db.query(model).filter(model.user_id == user.id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}


# ---------------- PROFILE / SKILL FORM ----------------
def _profile_dict(p: StudentProfile):
    return {k: getattr(p, k) for k in ("education_level", "goal", "interests", "strengths",
                                        "weaknesses", "hobbies", "learning_style", "hours_per_week")}


def _get_profile(db, user):
    p = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not p:
        p = StudentProfile(user_id=user.id)
        db.add(p)
        db.commit()
    return p


@api_router.get("/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)):
    joined_str = user.created_at.isoformat() if user.created_at else ""
    return {"id": user.id, "name": user.name, "email": user.email,
            "joined": joined_str, "profile": _profile_dict(_get_profile(db, user))}


@api_router.put("/profile")
def save_profile(data: ProfileIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _get_profile(db, user)
    for k, v in data.model_dump().items():
        setattr(p, k, v.strip() if isinstance(v, str) else v)
    db.commit()
    return _profile_dict(p)


# ---------------- COURSES / PROGRESS ----------------
def _course_dict(c: Course):
    return {"id": c.id, "title": c.title, "category": c.category, "level": c.level,
            "tags": [t for t in c.tags.split(",") if t], "duration_hours": c.duration_hours,
            "description": c.description, "syllabus": c.lessons or []}


@api_router.get("/courses")
def courses(user: User = Depends(current_user), db: Session = Depends(get_db)):
    enrolled = {e.course_id: e.progress for e in db.query(Enrollment).filter(Enrollment.user_id == user.id)}
    out = []
    for c in db.query(Course).all():
        d = _course_dict(c)
        d["enrolled"] = c.id in enrolled
        d["progress"] = enrolled.get(c.id, 0)
        out.append(d)
    return out


@api_router.get("/courses/{course_id}")
def get_course(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    c = db.get(Course, course_id)
    if not c:
        raise HTTPException(404, "Course not found")
    d = _course_dict(c)
    e = db.query(Enrollment).filter_by(user_id=user.id, course_id=course_id).first()
    d["enrolled"] = bool(e)
    d["progress"] = e.progress if e else 0
    return d


@api_router.post("/courses/{course_id}/enroll")
def enroll(course_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not db.get(Course, course_id):
        raise HTTPException(404, "Course not found")
    if not db.query(Enrollment).filter_by(user_id=user.id, course_id=course_id).first():
        db.add(Enrollment(user_id=user.id, course_id=course_id))
        db.commit()
    return {"ok": True}


@api_router.put("/progress/{course_id}")
def update_progress(course_id: int, data: ProgressIn, user: User = Depends(current_user),
                    db: Session = Depends(get_db)):
    e = db.query(Enrollment).filter_by(user_id=user.id, course_id=course_id).first()
    if not e:
        raise HTTPException(404, "Not enrolled in this course")
    e.progress = data.progress
    db.commit()
    return {"ok": True, "progress": e.progress}


@api_router.get("/progress")
def progress(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = (db.query(Enrollment, Course).join(Course, Course.id == Enrollment.course_id)
            .filter(Enrollment.user_id == user.id).all())
    items = [{"course_id": c.id, "title": c.title, "category": c.category,
              "progress": e.progress, "duration_hours": c.duration_hours} for e, c in rows]
    overall = round(sum(i["progress"] for i in items) / len(items)) if items else 0
    return {"overall": overall, "completed": sum(1 for i in items if i["progress"] >= 100), "items": items}


# ---------------- RECOMMENDATIONS ----------------
def _tokens(text: str):
    return {t for t in re.findall(r"[a-z0-9+#]+", (text or "").lower()) if len(t) > 2}


@api_router.get("/recommendations")
def recommendations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _get_profile(db, user)
    interest = _tokens(p.interests) | _tokens(p.goal)
    weak = _tokens(p.weaknesses)
    hobby = _tokens(p.hobbies)
    enrolled = {e.course_id for e in db.query(Enrollment).filter(Enrollment.user_id == user.id)}
    scored = []
    for c in db.query(Course).all():
        if c.id in enrolled:
            continue
        ctoks = _tokens(c.tags) | _tokens(c.title) | _tokens(c.category)
        i, w, h = ctoks & interest, ctoks & weak, ctoks & hobby
        score = 3 * len(i) + 2 * len(w) + len(h) + (1 if c.level == "Beginner" else 0)
        reasons = []
        if i: reasons.append("matches your interests/goal: " + ", ".join(sorted(i)))
        if w: reasons.append("helps improve weak areas: " + ", ".join(sorted(w)))
        if h: reasons.append("connects to your hobbies: " + ", ".join(sorted(h)))
        scored.append((score, c, "; ".join(reasons) or "popular starting course"))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for s, c, r in scored[:6]:
        d = _course_dict(c)
        d["reason"] = r
        d["score"] = s
        out.append(d)
    return out


# ---------------- QUIZ / PERFORMANCE ----------------
@api_router.get("/quiz/topics")
def quiz_topics(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return [t[0] for t in db.query(QuizQuestion.topic).distinct().all()]


@api_router.get("/quiz/questions")
def quiz_questions(topic: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    qs = db.query(QuizQuestion).filter(QuizQuestion.topic == topic).all()
    if not qs:
        raise HTTPException(404, "No questions for this topic")
    return [{"id": q.id, "question": q.question, "options": q.options} for q in qs]


@api_router.post("/quiz/submit")
def quiz_submit(data: QuizSubmitIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    score, details = 0, []
    for a in data.answers:
        q = db.get(QuizQuestion, a.question_id)
        if not q:
            continue
        ok = a.selected == q.answer_index
        score += int(ok)
        details.append({"question": q.question, "correct": ok, "your_answer": q.options[a.selected] if 0 <= a.selected < len(q.options) else None,
                        "right_answer": q.options[q.answer_index], "explanation": q.explanation})
    total = len(details)
    db.add(QuizResult(user_id=user.id, topic=data.topic, score=score, total=total))
    db.commit()
    return {"score": score, "total": total, "details": details}


@api_router.get("/performance")
def performance(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(QuizResult).filter(QuizResult.user_id == user.id).order_by(QuizResult.created_at).all()
    history = [{"topic": r.topic, "score": r.score, "total": r.total,
                "percent": round(100 * r.score / r.total) if r.total else 0,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M")} for r in rows]
    by_topic = defaultdict(list)
    for h in history:
        by_topic[h["topic"]].append(h["percent"])
    topics = [{"topic": t, "average": round(sum(v) / len(v)), "attempts": len(v)} for t, v in by_topic.items()]
    avg = round(sum(h["percent"] for h in history) / len(history)) if history else 0
    return {"average": avg, "attempts": len(history), "history": history, "topics": topics}


@api_router.get("/dashboard")
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)):
    prog = progress(user, db)
    perf = performance(user, db)
    return {"enrolled": len(prog["items"]), "completed": prog["completed"],
            "overall_progress": prog["overall"], "quizzes": perf["attempts"],
            "avg_score": perf["average"], "has_path": db.query(LearningPath).filter_by(user_id=user.id).count() > 0}


# ---------------- AI LEARNING PATH (LLM + RAG) ----------------
SYSTEM_PATH = ("You are an expert academic advisor. Build realistic, motivating, personalized learning paths. "
               "Respond ONLY with valid JSON.")


def _fallback_path(p, recs):
    return {
        "summary": "AI is unavailable right now, so this is a rule-based path built from your profile.",
        "weeks": [{"week": i + 1, "title": r["title"], "goals": [r["description"]],
                   "resources": ["Course: " + r["title"]], "practice": "Complete one mini exercise per session.",
                   "hours": max(1, min(p.hours_per_week, r["duration_hours"]))} for i, r in enumerate(recs[:4])],
        "tips": ["Study at the same time every day.", "Review weak topics weekly."],
        "sources": [],
    }


@api_router.post("/learning-path/generate")
def generate_path(user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _get_profile(db, user)
    if not (p.interests or p.goal or p.weaknesses):
        raise HTTPException(400, "Please fill the Skill Form first (interests, goal, weaknesses).")
    perf = performance(user, db)
    recs = recommendations(user, db)
    context = rag.retrieve(db, f"{p.goal} {p.interests} {p.weaknesses} learning roadmap", k=4)
    ctx_text = "\n\n".join(f"[{c['source']}]\n{c['content']}" for c in context) or "No extra knowledge available."
    catalog = "\n".join(f"- {c.title} ({c.level}, {c.duration_hours}h): {c.description}" for c in db.query(Course).all())
    prompt = f"""STUDENT PROFILE
Name: {user.name}
Education: {p.education_level}
Goal: {p.goal}
Interests: {p.interests}
Strengths: {p.strengths}
Weaknesses: {p.weaknesses}
Hobbies: {p.hobbies}
Learning style: {p.learning_style}
Hours per week: {p.hours_per_week}
Quiz average: {perf['average']}% | By topic: {perf['topics']}

AVAILABLE COURSES
{catalog}

KNOWLEDGE BASE (retrieved with RAG - use it to ground your plan)
{ctx_text}

Create a personalized 6-week learning path. Use the catalog courses where suitable, fit the weekly hours,
give extra attention to weaknesses, build on strengths and use the learning style and hobbies for motivation.
Return JSON exactly in this shape:
{{"summary": "2-3 sentences", "weeks": [{{"week": 1, "title": "", "goals": ["", ""], "resources": ["", ""], "practice": "", "hours": 5}}], "tips": ["", ""]}}"""
    try:
        path = api_calling.generate_json(prompt, system=SYSTEM_PATH)
        path.setdefault("weeks", [])
        path["sources"] = sorted({c["source"] for c in context})
        path["ai"] = True
    except Exception as e:
        path = _fallback_path(p, recs)
        path["ai"] = False
        path["error"] = str(e)[:200]
    db.add(LearningPath(user_id=user.id, content=path))
    db.commit()
    return path


@api_router.get("/learning-path")
def get_path(user: User = Depends(current_user), db: Session = Depends(get_db)):
    lp = db.query(LearningPath).filter_by(user_id=user.id).order_by(LearningPath.id.desc()).first()
    return lp.content if lp else None


@api_router.delete("/learning-path")
def reset_learning_path(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(LearningPath).filter_by(user_id=user.id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Learning recommendations reset"}


# ---------------- RAG CHAT TUTOR ----------------
@api_router.post("/chat")
def chat(data: ChatIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _get_profile(db, user)
    context = rag.retrieve(db, data.message, k=4)
    ctx_text = "\n\n".join(f"[{c['source']}]\n{c['content']}" for c in context)
    prompt = f"""Student: {user.name}. Goal: {p.goal}. Weaknesses: {p.weaknesses}. Style: {p.learning_style}.

Context from the knowledge base:
{ctx_text}

Question: {data.message}

Answer clearly and concisely. Prefer the context when relevant; say so if the context does not cover it."""
    try:
        answer = api_calling.generate_text(prompt, system="You are LearnAI, a friendly personal tutor.")
    except Exception as e:
        if context:
            answer = (f"Note: AI service is temporarily offline; answering from knowledge base:\n\n"
                      + "\n\n".join(c["content"] for c in context[:2]))
        else:
            raise HTTPException(502, f"AI service error: {str(e)[:200]}")
    return {"answer": answer, "sources": sorted({c["source"] for c in context})}


@api_router.post("/rag/reindex")
def reindex(user: User = Depends(current_user), db: Session = Depends(get_db)):
    from models import KBChunk
    db.query(KBChunk).delete()
    db.commit()
    return rag.ingest_kb(db)


app.include_router(api_router)
app.include_router(api_router, prefix="/api")
