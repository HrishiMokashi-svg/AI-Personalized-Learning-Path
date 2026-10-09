@echo off
title LearnAI Frontend
cd /d "%~dp0"

echo ==========================================
echo   LearnAI Frontend
echo ==========================================
echo   Frontend: http://127.0.0.1:5500/
echo   Backend:  http://127.0.0.1:8000/
echo ==========================================

start "" http://127.0.0.1:5500/index.html

if exist "..\Backend\.venv\Scripts\python.exe" (
  ..\Backend\.venv\Scripts\python.exe -m http.server 5500 --bind 127.0.0.1
) else (
  python -m http.server 5500 --bind 127.0.0.1
)
pause
