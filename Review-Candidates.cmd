@echo off
title Aasha Vocabulary Review Queue
cd /d "%~dp0"
set PYTHONPATH=%~dp0aasha-pipeline-with-master-json\src
where.exe py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    py aasha-pipeline-with-master-json\src\aasha\manage_dictionary.py
) else (
    python aasha-pipeline-with-master-json\src\aasha\manage_dictionary.py
)
pause

