@echo off
title LearnAI Frontend
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python is required to serve the frontend. Install Python 3.10+.
  pause
  exit /b 1
)
echo ==========================================
echo   LearnAI Frontend
echo   Open http://127.0.0.1:5500 in your browser
echo   (Backend must be running on http://127.0.0.1:8001)
echo ==========================================
start "" http://127.0.0.1:5500/index.html
python -m http.server 5500 --bind 127.0.0.1
pause
