@echo off
echo ==============================================
echo  Red Rose POS - Starting Application...
echo ==============================================

echo [1/3] Starting Backend Server...
start "Red Rose Backend" cmd /k "cd backend && pip install -r requirements.txt && python server.py"

echo [2/3] Starting Frontend Server...
start "Red Rose Frontend" cmd /k "cd frontend && yarn install && yarn start"

echo ==============================================
echo  Application is starting!
echo  Backend will run on its default port.
echo  Frontend will run on http://localhost:3000
echo  Make sure MongoDB is running locally!
echo ==============================================
pause
