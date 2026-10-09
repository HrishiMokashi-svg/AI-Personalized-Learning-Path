@echo off
title AI Personalized Learning Path

echo Starting Backend...
start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload"

timeout /t 2 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0frontend && python -m http.server 5500"

echo.
echo Both servers are starting!
echo Frontend: http://127.0.0.1:5500
echo Backend:  http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs

pause