@echo off
REM setup_and_run.bat

REM --- Backend setup ---
cd backend

REM Create venv if it doesn't exist
if not exist venv (
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate

REM Install backend dependencies
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    pip install flask flask-cors pgmpy
)


REM Start backend (in new window)
start cmd /k python app.py

REM --- Frontend setup ---
cd ..\frontend

REM Install frontend dependencies
if exist package.json (
    npm install
)

REM Start frontend (in new window)
start cmd /k npm start

echo.
echo Both backend and frontend are starting in new windows!
pause