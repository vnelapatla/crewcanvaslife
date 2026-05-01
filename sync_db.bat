@echo off
echo ========================================
echo   CrewCanvas - Database Schema Sync
echo ========================================
echo.

REM Check if MySQL JDBC driver exists in target or local maven repo
REM We use the one from the project build if available
set DRIVER_PATH=target\classes;target\test-classes;%USERPROFILE%\.m2\repository\com\mysql\mysql-connector-j\8.0.33\mysql-connector-j-8.0.33.jar

echo [1/2] Compiling DatabaseSync.java...
javac DatabaseSync.java
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. Make sure Java is installed.
    pause
    exit /b 1
)

echo [2/2] Running DatabaseSync...
echo.
java -cp ".;%DRIVER_PATH%" DatabaseSync
if %errorlevel% neq 0 (
    echo.
    echo [TIP] If it failed because of missing MySQL Driver, please build the project first using 'mvn clean package'
)

echo.
echo ========================================
echo   Sync Process Finished
echo ========================================
pause
