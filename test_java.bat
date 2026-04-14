@echo off
set "JAVA_HOME=C:\Users\Navi\crewcanvascopy\Crew_Canvas\CrewCanvas copy 5\tools\java"
set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
set "JAVAC_EXE=%JAVA_HOME%\bin\javac.exe"

echo [TEST] Compiling...
"%JAVAC_EXE%" Test.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed
    exit /b 1
)

echo [TEST] Running...
"%JAVA_EXE%" Test
del Test.class Test.java
