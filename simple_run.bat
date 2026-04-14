@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "MAVEN_BIN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
set "PATH=%MAVEN_BIN%;%JAVA_HOME%\bin;%PATH%"

echo [INFO] Starting application... > app_run.log
"%MAVEN_BIN%\mvn.cmd" spring-boot:run >> app_run.log 2>&1
