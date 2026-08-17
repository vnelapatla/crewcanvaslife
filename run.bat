@echo off
echo ========================================
echo   CrewCanvas - Film Industry Platform
echo ========================================
echo.

taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do taskkill /f /pid %%a 2>nul

REM Check if Java is installed
echo [1/4] Checking Java installation...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed or not in PATH
    echo Please install Java 17 from: https://adoptium.net/
    echo.
    pause
    exit /b 1
)
echo [OK] Java is installed
echo.

REM Check if Maven is installed
echo [2/4] Checking Maven installation...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH
    echo Please install Maven from: https://maven.apache.org/download.cgi
    echo.
    pause
    exit /b 1
)
echo [OK] Maven is installed
echo.

REM Build the project
echo [3/4] Building the project...
echo This may take a few minutes on first run...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    echo Check the error messages above
    pause
    exit /b 1
)
echo [OK] Build successful
echo.

REM Run the application
echo [4/4] Starting CrewCanvas...
echo.
echo ========================================
echo   Application is starting...
echo   Access at: http://localhost:8081
echo.
echo   Database: MySQL (crewcanvas_db)
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call mvn spring-boot:run
