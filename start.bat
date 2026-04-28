@echo off
echo Starting OhMaiShoot Local Environment...

echo [1/2] Setting up Backend...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python requirements...
pip install -r requirements.txt > nul 2>&1
echo Starting FastAPI server...
start cmd /k "title OhMaiShoot Backend && call venv\Scripts\activate.bat && uvicorn main:app --reload"
cd ..

echo [2/2] Setting up Frontend...
cd frontend
echo Installing Node modules...
call npm install > nul 2>&1
echo Starting Vite server...
start cmd /k "title OhMaiShoot Frontend && npm run dev"
cd ..

echo.
echo ====================================================
echo Both servers have been launched in new windows.
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173 
echo - Admin: http://localhost:5173/admin
echo.
echo Automatically opening frontend in your browser...
echo ====================================================

timeout /t 3 /nobreak > nul
start http://localhost:5173
