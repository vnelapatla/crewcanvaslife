@echo off
cd /d "%~dp0"

set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%MAVEN_BIN%;%PATH%"

echo ====================================================
echo   Starting KrewCanvas Application Locally
echo ====================================================
echo.
echo URL: http://localhost:8081
echo DB:  localhost:3306/crewcanvas_db
echo.

echo [1/2] Compiling and copying fresh static resources...
call "%MAVEN_BIN%\mvn.cmd" compile -DskipTests

echo.
echo [2/2] Launching Spring Boot server on http://localhost:8081 ...
call "%MAVEN_BIN%\mvn.cmd" spring-boot:run

pause
