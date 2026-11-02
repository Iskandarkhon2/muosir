@echo off
chcp 65001 > nul
title Муосир пласт - Локальный сервер
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    node server.js
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
)
pause
