@echo off
title Aasha Repo Tests
cd /d "%~dp0Aasha-Learning-Impact-Ecosystem-v0.3-full-repo"
echo ====================================================
echo  Running Aasha Ecosystem Architecture Tests...
echo ====================================================
npm.cmd run validate
pause
