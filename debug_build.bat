@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [DEBUG] Java Home: "%JAVA_HOME%"
echo [DEBUG] Maven Bin: "%MAVEN_BIN%"

echo [DEBUG] Check Maven Version...
call "%MAVEN_BIN%\mvn.cmd" -version
if %errorlevel% neq 0 (
    echo [ERROR] Maven version check failed
    exit /b 1
)

echo [DEBUG] Starting Maven Build...
call "%MAVEN_BIN%\mvn.cmd" clean install -DskipTests
if %errorlevel% neq 0 (
  echo [ERROR] BUILD FAILED with exit code %errorlevel%
) else (
  echo [SUCCESS] Build Finished
)
