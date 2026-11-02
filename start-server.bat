@echo off
chcp 65001 > nul 

where node >nul 2>nul
if %errorlevel% equ 0 (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
) else (
    echo Node.js 20 or newer is required. Install Node.js and try again.
    exit /b 1
)
