@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "MVN=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin\mvn.cmd"

echo Building user-service...
call "%MVN%" -f user-service/pom.xml clean package -DskipTests

echo.
echo Building event-service...
call "%MVN%" -f event-service/pom.xml clean package -DskipTests

echo Builds Finished.
