@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ===================================================
echo   CrewCanvas - Run Monolith
echo ===================================================
echo.
echo [1/3] Stopping any running Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Cleaning and Building Monolith...
echo Using Maven at: "%MAVEN_BIN%"
echo Using Project File: pom.xml
call "%MAVEN_BIN%\mvn.cmd" -f pom.xml clean install -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Build Failed! Check the error messages above.
    pause
    exit /b 1
)

echo [3/3] Starting Application...
echo.
echo Application will start on port 8081 (as per application.properties)
echo DB: localhost:3306/crewcanvas_db
echo.
call "%MAVEN_BIN%\mvn.cmd" -f pom.xml spring-boot:run
pause
