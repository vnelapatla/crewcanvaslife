@echo off
echo ========================================
echo   CrewCanvas - Build Only
echo ========================================
echo.

REM Check if Maven is installed
echo Checking Maven installation...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed or not in PATH
    pause
    exit /b 1
)

echo Building project...
call mvn clean package -DskipTests

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Build Successful!
    echo   JAR file: target\crewcanvas-0.0.1-SNAPSHOT.jar
    echo.
    echo   To run: java -jar target\crewcanvas-0.0.1-SNAPSHOT.jar
    echo   Or use: run.bat
    echo ========================================
) else (
    echo.
    echo [ERROR] Build failed
)

pause
