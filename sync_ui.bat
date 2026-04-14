@echo off
echo [1/3] Navigating to Frontend...
cd frontend

echo [2/3] Building Premium React UI (this translates React to static HTML/JS)...
call npm run build

echo [3/3] Deploying to Spring Boot static resources...
xcopy /s /e /y dist\* ..\src\main\resources\static\

echo.
echo ======================================================
echo ✅ SUCCESS! Premium UI is now integrated.
echo Please RESTART your Spring Boot application.
echo View it at: http://localhost:8081/index.html
echo ======================================================
pause
