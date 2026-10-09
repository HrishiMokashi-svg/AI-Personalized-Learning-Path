@echo off
title AI Personalized Learning Path
cd /d "%~dp0"

echo ==========================================
echo   AI PERSONALIZED LEARNING PATH
echo ==========================================

REM Detect python executable
if exist "%~dp0.venv\Scripts\python.exe" (
  set "PY_CMD=%~dp0.venv\Scripts\python.exe"
) else if exist "%~dp0Backend\.venv\Scripts\python.exe" (
  set "PY_CMD=%~dp0Backend\.venv\Scripts\python.exe"
) else (
  set "PY_CMD=python"
)

REM Free port 8000 if already occupied by stale server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

REM Free port 5500 if already occupied
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5500" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

echo Starting FastAPI backend...
start "AI Backend" cmd /k "cd /d ""%~dp0Backend"" && ""%PY_CMD%"" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting frontend website...
start "AI Frontend" cmd /k "cd /d ""%~dp0Frontend"" && ""%PY_CMD%"" -m http.server 5500 --bind 127.0.0.1"

timeout /t 3 /nobreak >nul

start "" http://127.0.0.1:5500/

echo.
echo Startup commands sent.
echo Frontend: http://127.0.0.1:5500/
echo Backend:  http://127.0.0.1:8000/health
echo.
pause
