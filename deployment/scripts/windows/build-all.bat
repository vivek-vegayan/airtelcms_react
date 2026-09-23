@echo off
REM ============================================================================
REM CHM - Build frontend (Vite) and backend (Maven WAR) on the build machine.
REM Edit the two repo paths below if your checkout locations differ.
REM ============================================================================
setlocal

set "FRONTEND_DIR=D:\CHM_airtel_scheduler\Github_Repo\CHM_airtel_beta"
set "BACKEND_DIR=D:\CHM_airtel_scheduler\Github_Repo\airtelmanagement"

echo === [1/2] Building frontend (vite build via "ready-hoja") ===
cd /d "%FRONTEND_DIR%" || goto :fail
call npm ci || call npm install || goto :fail
call npm run ready-hoja || goto :fail
echo Frontend build output: %FRONTEND_DIR%\dist

echo.
echo === [2/2] Building backend (Maven package, tests skipped) ===
cd /d "%BACKEND_DIR%" || goto :fail
call mvnw.cmd clean package -DskipTests || goto :fail
echo Backend artifact: %BACKEND_DIR%\target\airtelmanagement-0.0.1-SNAPSHOT.war

echo.
echo BUILD OK
exit /b 0

:fail
echo.
echo BUILD FAILED (see errors above)
exit /b 1
