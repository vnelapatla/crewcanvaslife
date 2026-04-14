@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "PATH=%JAVA_HOME%\bin;%PATH%;C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\maven\bin"
cd /d "d:\Springbootcrewcanvas\event-service"
echo Building event-service...
call mvn package -DskipTests
echo Build Finished.
