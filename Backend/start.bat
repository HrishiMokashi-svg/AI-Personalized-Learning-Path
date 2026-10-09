@echo off
title AI Personalized Learning Path - Backend
cd /d "%~dp0"

echo ==========================================
echo   LearnAI Backend (FastAPI)
echo ==========================================

REM Detect python executable
if exist ".venv\Scripts\python.exe" (
  set "PY_CMD=.venv\Scripts\python.exe"
) else if exist "..\.venv\Scripts\python.exe" (
  set "PY_CMD=..\.venv\Scripts\python.exe"
) else (
  set "PY_CMD=python"
)

REM Free port 8000 if already occupied by stale server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo Starting uvicorn on http://127.0.0.1:8000 ...
"%PY_CMD%" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause