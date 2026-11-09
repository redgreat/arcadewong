@echo off
rem Double-click this file and answer YES to the UAC prompt.
rem It installs the built-in Microsoft WinUSB driver for the second "Arcade (app)" USB interface.
setlocal
net session >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator privileges...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-arcade-driver.ps1"
echo.
echo Installation result is in driver-install.log next to this file.
pause
