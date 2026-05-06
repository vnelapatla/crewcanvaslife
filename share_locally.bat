@echo off
echo ===================================================
echo   CrewCanvas Local Share Utility
echo ===================================================
echo.
echo This utility will create a temporary public link 
echo for your local Casting Deck so you can test it on 
echo WhatsApp or share it with others.
echo.
echo NOTE: You must have Node.js installed.
echo.
set /p port="Enter your local port (default is 8081): "
if "%port%"=="" set port=8081

echo.
echo Generating public link for port %port%...
echo (This may take a moment to initialize)
echo.
npx localtunnel --port %port%
