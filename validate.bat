@echo off
echo [VALIDATE] Starting local validation...

echo [VALIDATE] Running Clean Build, Tests, and Style Checks...
call mvn clean validate test
if %errorlevel% neq 0 (
    echo [ERROR] Validation failed! Please fix issues before pushing.
    exit /b 1
)

echo [VALIDATE] Success! All checks passed.
