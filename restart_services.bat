@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%MAVEN_BIN%;%JAVA_HOME%\bin;%PATH%"

echo ===================================================
echo   CrewCanvas - Restarting Infrastructure
echo ===================================================

echo [1/4] Stopping existing Java processes...
taskkill /F /IM java.exe 2>nul

echo.
echo [2/4] Starting Kafka Server...
start "Kafka Server" "C:\kafka1\kafka_2.13-4.2.0\start_kafka.bat"

echo.
echo [3/4] Starting Discovery and Gateway...
start "Eureka Server" "%JAVA_EXE%" -jar "eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar"
start "API Gateway (8090)" "%JAVA_EXE%" -jar "api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar"

echo.
echo [4/4] Starting Backend Services...
start "User Service (8081)" "%JAVA_EXE%" -jar "user-service\target\user-service-0.0.1-SNAPSHOT.jar"
start "Event Service (8082)" "%JAVA_EXE%" -jar "event-service\target\event-service-0.0.1-SNAPSHOT.jar"
start "Feed Service (8083)" "%JAVA_EXE%" -jar "feed-service\target\feed-service-0.0.1-SNAPSHOT.jar"
start "Chat Service (8084)" "%JAVA_EXE%" -jar "chat-service\target\chat-service-0.0.1-SNAPSHOT.jar"

echo ===================================================
echo   All Services Launched!
echo ===================================================
