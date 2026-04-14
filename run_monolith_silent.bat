@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [INFO] Starting Monolith Build... > monolith_run.log
echo [INFO] Java Home: "%JAVA_HOME%" >> monolith_run.log

echo [INFO] Cleaning and Building... >> monolith_run.log
call "%MAVEN_BIN%\mvn.cmd" -f pom-monolith.xml clean install -DskipTests >> monolith_run.log 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Build Failed! >> monolith_run.log
    exit /b 1
)

echo [INFO] Build Successful. Starting App... >> monolith_run.log
call "%MAVEN_BIN%\mvn.cmd" -f pom-monolith.xml spring-boot:run >> monolith_run.log 2>&1
