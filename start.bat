
@echo off
title AI Personalized Learning Path
cd /d "%~dp0"

echo ==========================================
echo   AI PERSONALIZED LEARNING PATH
echo ==========================================

echo Starting FastAPI backend...
start "AI Backend" cmd /k "cd /d ""%~dp0Backend"" && .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting frontend website...
start "AI Frontend" cmd /k "cd /d ""%~dp0Frontend"" && ..\Backend\.venv\Scripts\python.exe -m http.server 5500 --bind 127.0.0.1"

timeout /t 3 /nobreak >nul

start "" http://127.0.0.1:5500/

echo.
echo Startup commands sent.
echo Frontend: http://127.0.0.1:5500/
echo Backend:  http://127.0.0.1:8000/health
echo.
pause
