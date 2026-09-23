@echo off
REM ============================================================================
REM CHM - Deploy built artifacts on the Windows server.
REM  - Copies React dist/  -> C:\vegayan\simplus\www\airtelchmbeta
REM  - Copies WAR          -> C:\vegayan\simplus\app\airtelmanagement.war
REM  - Copies error pages  -> C:\vegayan\simplus\www\error-pages
REM Stops the backend service first, restarts everything after.
REM Run from an elevated (Administrator) prompt.
REM ============================================================================
setlocal

set "FRONTEND_DIST=D:\CHM_airtel_scheduler\Github_Repo\CHM_airtel_beta\dist"
set "ERROR_PAGES=D:\CHM_airtel_scheduler\Github_Repo\CHM_airtel_beta\deployment\config\error-pages"
set "BACKEND_WAR=D:\CHM_airtel_scheduler\Github_Repo\airtelmanagement\target\airtelmanagement-0.0.1-SNAPSHOT.war"

set "WWW_ROOT=C:\vegayan\simplus\www"
set "APP_DIR=C:\vegayan\simplus\app"

if not exist "%FRONTEND_DIST%\index.html" echo ERROR: frontend dist not found - run build-all.bat first & exit /b 1
if not exist "%BACKEND_WAR%"              echo ERROR: backend WAR not found  - run build-all.bat first & exit /b 1

echo === Stopping backend service ===
net stop CHM-Backend 2>nul

echo === Deploying frontend ===
if not exist "%WWW_ROOT%" mkdir "%WWW_ROOT%"
robocopy "%FRONTEND_DIST%" "%WWW_ROOT%\airtelchmbeta" /MIR /NFL /NDL /NJH
if errorlevel 8 goto :fail
robocopy "%ERROR_PAGES%" "%WWW_ROOT%\error-pages" /MIR /NFL /NDL /NJH
if errorlevel 8 goto :fail

echo === Deploying backend ===
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
copy /y "%BACKEND_WAR%" "%APP_DIR%\airtelmanagement.war" || goto :fail

echo === Ensuring runtime directories exist ===
if not exist "D:\files_path"   mkdir "D:\files_path"
if not exist "D:\files_path2"  mkdir "D:\files_path2"
if not exist "D:\CHM_LOGS"     mkdir "D:\CHM_LOGS"
if not exist "C:\vegayan\simplus\sftp_uploads" mkdir "C:\vegayan\simplus\sftp_uploads"

if not exist "C:\vegayan\simplus\airtelcms-config.properties" (
    echo WARNING: C:\vegayan\simplus\airtelcms-config.properties is MISSING.
    echo          The backend will not start. Copy and fill the template from
    echo          deployment\config\airtelcms-config.sample.properties
)

echo === Starting services ===
net start CHM-Backend  || echo WARNING: could not start CHM-Backend
net start CHM-Nginx    || echo WARNING: could not start CHM-Nginx (may already be running)
"C:\nginx\nginx.exe" -p C:\nginx -s reload 2>nul

echo.
echo DEPLOY OK - verify:  curl http://localhost/airtelchmbeta/  and  curl http://127.0.0.1:8686/actuator/health
exit /b 0

:fail
echo DEPLOY FAILED (see errors above)
exit /b 1
