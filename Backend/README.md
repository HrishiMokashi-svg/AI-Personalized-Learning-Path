# LearnAI - Backend (FastAPI + MySQL + Gemini + RAG)

## Setup
1. Install Python 3.10+ and MySQL 8 (make sure MySQL is running).
2. Get a free key from Google AI Studio: https://aistudio.google.com/apikey
3. Edit `.env`: set GOOGLE_API_KEY, DB_USER, DB_PASSWORD (database `learnai` is created automatically).
4. Double-click `start.bat` -> API on http://127.0.0.1:8001 (docs at /docs).

## What happens on startup
- Tables are created in MySQL, demo courses (with four-module syllabi) + quiz questions are seeded. Existing demo courses are also backfilled with their syllabus when missing.
- Files in `kb/` are chunked, embedded with Gemini and stored in `kb_chunks` (RAG). Add your own .md/.txt files there and call POST /rag/reindex.

## Files
main.py (routes) | api_calling.py (Gemini LLM + embeddings) | rag.py (RAG) | models.py, database.py (MySQL) | auth.py (JWT) | seed.py | kb/ (knowledge base)
