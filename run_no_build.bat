@echo off
set "JAVA_EXE=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java\bin\java.exe"

echo ===================================================
echo   CrewCanvas - Running Existing Build
echo ===================================================
echo.
echo Note: This script runs the previously built JAR files.
echo If you have made code changes, please build in Eclipse first.
echo.

echo [1/6] Starting Eureka Server...
start "Eureka Server" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar"

echo Waiting for Eureka to initialize (15 seconds)...
timeout /t 15

echo [2/6] Starting API Gateway...
start "API Gateway (8080)" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar"

echo [3/6] Starting User Service...
start "User Service (8081)" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\user-service\target\user-service-0.0.1-SNAPSHOT.jar"

echo [4/6] Starting Event Service...
start "Event Service (8082)" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\event-service\target\event-service-0.0.1-SNAPSHOT.jar"

echo [5/6] Starting Feed Service...
start "Feed Service (8083)" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\feed-service\target\feed-service-0.0.1-SNAPSHOT.jar"

echo [6/6] Starting Chat Service...
start "Chat Service (8084)" "%JAVA_EXE%" -jar "d:\Springbootcrewcanvas\chat-service\target\chat-service-0.0.1-SNAPSHOT.jar"

echo.
echo ===================================================
echo   All Services Started!
echo   Access at: http://localhost:8080
echo ===================================================
pause
