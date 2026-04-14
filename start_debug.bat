@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%MAVEN_BIN%;%JAVA_HOME%\bin;%PATH%"

echo [DIAGNOSTIC] Killing Java Processes...
taskkill /F /IM java.exe >nul 2>&1

echo [DIAGNOSTIC] Starting Eureka...
start "Eureka" /B "%JAVA_EXE%" -jar "eureka-server\target\eureka-server-0.0.1-SNAPSHOT.jar" > eureka.log 2>&1

echo [DIAGNOSTIC] Waiting for Eureka (15s)...
timeout /t 15 /nobreak >nul

echo [DIAGNOSTIC] Starting API Gateway...
start "ApiGateway" /B "%JAVA_EXE%" -jar "api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar" > gateway.log 2>&1

echo [DIAGNOSTIC] Waiting for Gateway (15s)...
timeout /t 15 /nobreak >nul

echo [DIAGNOSTIC] Checking Ports...
netstat -ano | findstr "8080 8761" > ports.log
