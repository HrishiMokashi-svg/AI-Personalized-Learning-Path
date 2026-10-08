@echo off
title LearnAI Backend
cd /d "%~dp0"

echo ==========================================
echo   LearnAI Backend  (FastAPI + MySQL + Gemini)
echo ==========================================

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is not installed or not in PATH. Install Python 3.10+ first.
  pause
  exit /b 1
)

if exist .venv\Scripts\activate.bat (
  call .venv\Scripts\activate.bat
) else if exist venv\Scripts\activate.bat (
  call venv\Scripts\activate.bat
)

echo Installing requirements...
python -m pip install -r requirements.txt --quiet

if not exist .env (
  copy .env.example .env >nul
  echo .env created - open it, add GOOGLE_API_KEY and MySQL password, then run start.bat again.
  notepad .env
  pause
  exit /b 0
)

echo.
echo Starting server on http://127.0.0.1:8001  (API docs: http://127.0.0.1:8001/docs)
echo Make sure MySQL is running.
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
pause
