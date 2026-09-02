@echo off
title Aasha Learner Web App
cd /d "%~dp0Aasha-Learning-Impact-Ecosystem-v0.3-full-repo"
echo ====================================================
echo  Starting Aasha Learner Web App on port 4173...
echo ====================================================
start http://localhost:4173
node apps/learner-web/src/server.js
pause
