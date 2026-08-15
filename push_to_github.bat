@echo off
cd /d "%~dp0"

echo ====================================================
echo   Pushing KrewCanvas Brand & UI Updates to GitHub
echo ====================================================
echo.
echo Current Directory: %CD%
echo.

echo [1/3] Staging all modified files...
git add -A

echo.
echo [2/3] Committing brand changes (KrewCanvas)...
git commit -m "Update brand name and UI text to KrewCanvas across entire website and frontend UI"

echo.
echo [3/3] Pushing to feature branch...
git push

echo.
echo ====================================================
echo   Push to feature branch complete!
echo ====================================================
pause
