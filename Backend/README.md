# LearnAI - Backend (FastAPI + MySQL + Gemini + RAG)

## Setup
1. Install Python 3.10+ and MySQL 8 (make sure MySQL is running).
2. Get a free key from Google AI Studio: https://aistudio.google.com/apikey
3. Edit `.env`: set GOOGLE_API_KEY, DB_USER, DB_PASSWORD (database `learnai` is created automatically).
4. Double-click `start.bat` -> API on http://127.0.0.1:8001 (docs at /docs).

## What happens on startup
- Tables are created in MySQL, demo courses (with four-module syllabi) + quiz questions are seeded. Existing demo courses are also backfilled with their syllabus when missing.
- Files in `kb/` are chunked, embedded with Gemini and stored in `kb_chunks` (RAG). Add your own .md/.txt files there and call POST /rag/reindex.

## Production deployment
The frontend is deployed separately as a static Vercel project. This backend is not included in that deployment and is not currently configured as a Vercel serverless function: it requires a reachable MySQL service and performs database creation, seeding, and knowledge-base ingestion during startup. Deploy it as a separate Python web service with a managed MySQL database, and configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, and `GOOGLE_API_KEY` as server-side environment variables. Point `Frontend/js/config.js` at the resulting public API URL. Never put those secrets in the frontend or commit `.env`.

## Files
main.py (routes) | api_calling.py (Gemini LLM + embeddings) | rag.py (RAG) | models.py, database.py (MySQL) | auth.py (JWT) | seed.py | kb/ (knowledge base)
