@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [DEBUG] Java Home: "%JAVA_HOME%" > monolith_build.log
echo [DEBUG] Maven Bin: "%MAVEN_BIN%" >> monolith_build.log

echo [DEBUG] Building Monolith... >> monolith_build.log
call "%MAVEN_BIN%\mvn.cmd" -f pom-monolith.xml clean install -DskipTests >> monolith_build.log 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Build Failed! >> monolith_build.log
) else (
    echo [SUCCESS] Build Finished >> monolith_build.log
)
