@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ===================================================
echo   CrewCanvas - Rebuild and Run (Full Build)
echo ===================================================
echo.
echo [1/8] Stopping any running Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/8] Copying Static Files to API Gateway...
xcopy /E /I /Y "src\main\resources\static" "api-gateway\src\main\resources\static" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Failed to copy static files. Continuing build anyway...
) else (
    echo [OK] Static files updated.
)

echo [3/8] Cleaning and Building Main Project...
echo Using Maven at: "%MAVEN_BIN%"
call "%MAVEN_BIN%\mvn.cmd" clean install -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Build Failed! Check the error messages above.
    pause
    exit /b 1
)

echo [4/8] Starting Eureka Server...
start "Eureka Server" "%JAVA_EXE%" -jar "eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar"
echo Waiting for Eureka (10s)...
timeout /t 10 /nobreak >nul

echo [5/8] Starting API Gateway...
start "API Gateway (8080)" "%JAVA_EXE%" -jar "api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar"

echo [6/8] Starting User Service...
start "User Service (8081)" "%JAVA_EXE%" -jar "user-service\target\user-service-0.0.1-SNAPSHOT.jar"

echo [7/8] Starting Event Service...
start "Event Service (8082)" "%JAVA_EXE%" -jar "event-service\target\event-service-0.0.1-SNAPSHOT.jar"

echo [8/8] Starting Feed & Chat Services...
start "Feed Service (8083)" "%JAVA_EXE%" -jar "feed-service\target\feed-service-0.0.1-SNAPSHOT.jar"
start "Chat Service (8084)" "%JAVA_EXE%" -jar "chat-service\target\chat-service-0.0.1-SNAPSHOT.jar"

echo.
echo ===================================================
echo   Build Complete & Services Started!
echo   Access at: http://localhost:8080
echo ===================================================
pause
