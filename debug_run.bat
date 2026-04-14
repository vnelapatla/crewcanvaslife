@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [INFO] checking java version... > debug_run.log
"%JAVA_HOME%\bin\java.exe" -version >> debug_run.log 2>&1

echo [INFO] cleaning and building... >> debug_run.log
call "%MAVEN_BIN%\mvn.cmd" clean install -DskipTests >> debug_run.log 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Build Failed! >> debug_run.log
    exit /b 1
)

echo [INFO] Build Successful. Starting App... >> debug_run.log
call "%MAVEN_BIN%\mvn.cmd" spring-boot:run >> debug_run.log 2>&1
