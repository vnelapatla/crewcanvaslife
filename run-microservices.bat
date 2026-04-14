 @echo off
echo ===================================================
echo   CrewCanvas Microservices Launcher
echo ===================================================

echo [SETUP] Adding Java and Maven to PATH...
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "PATH=%JAVA_HOME%\bin;%PATH%;C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
java -version
call mvn -version

xcopy /E /I /Y "src\main\resources\static" "api-gateway\src\main\resources\static"

echo [2/8] Building Microservices...
call mvn clean install -DskipTests
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo [3/8] Starting Eureka Discovery Server...
start "Eureka Server" java -jar eureka-server/target/eureka-server-0.0.1-SNAPSHOT.jar

echo Waiting for Eureka to start... (10 seconds)
timeout /t 10

echo [4/8] Starting API Gateway...
start "API Gateway (Port 8080)" java -jar api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar

echo [5/8] Starting User Service...
start "User Service (Port 8081)" java -jar user-service/target/user-service-0.0.1-SNAPSHOT.jar

echo [6/8] Starting Event Service...
start "Event Service (Port 8082)" java -jar event-service/target/event-service-0.0.1-SNAPSHOT.jar

echo [7/8] Starting Feed Service...
start "Feed Service (Port 8083)" java -jar feed-service/target/feed-service-0.0.1-SNAPSHOT.jar

echo [8/8] Starting Chat Service...
start "Chat Service (Port 8084)" java -jar chat-service/target/chat-service-0.0.1-SNAPSHOT.jar

echo ===================================================
echo   All Services Launched!
echo   Access the App at: http://localhost:8080
echo ===================================================
pause
