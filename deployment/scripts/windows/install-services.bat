@echo off
REM ============================================================================
REM CHM - One-time registration of Windows services with NSSM.
REM Prerequisites: NSSM at C:\tools\nssm\nssm.exe, Java 17 on PATH or at JAVA_EXE,
REM                nginx extracted at C:\nginx, WAR deployed by deploy.bat.
REM Run from an elevated (Administrator) prompt.
REM ============================================================================
setlocal

set "NSSM=C:\tools\nssm\nssm.exe"
set "JAVA_EXE=C:\Program Files\Java\jdk-17\bin\java.exe"
set "APP_DIR=C:\vegayan\simplus\app"
set "NGINX_DIR=C:\nginx"

if not exist "%NSSM%" echo ERROR: NSSM not found at %NSSM% & exit /b 1

echo === Registering CHM-Backend (Spring Boot) ===
"%NSSM%" install CHM-Backend "%JAVA_EXE%" ^
  "-Xms512m -Xmx2g -XX:+UseG1GC -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Kolkata -jar %APP_DIR%\airtelmanagement.war --logging.level.com.vegayan.airtelmanagement=INFO"
"%NSSM%" set CHM-Backend AppDirectory "%APP_DIR%"
"%NSSM%" set CHM-Backend DisplayName "CHM Airtel Backend (Spring Boot)"
"%NSSM%" set CHM-Backend Start SERVICE_AUTO_START
"%NSSM%" set CHM-Backend AppStdout "D:\CHM_LOGS\backend-stdout.log"
"%NSSM%" set CHM-Backend AppStderr "D:\CHM_LOGS\backend-stderr.log"
"%NSSM%" set CHM-Backend AppRotateFiles 1
"%NSSM%" set CHM-Backend AppRotateBytes 10485760
"%NSSM%" set CHM-Backend AppExit Default Restart
"%NSSM%" set CHM-Backend AppRestartDelay 5000

echo === Registering CHM-Nginx ===
"%NSSM%" install CHM-Nginx "%NGINX_DIR%\nginx.exe"
"%NSSM%" set CHM-Nginx AppDirectory "%NGINX_DIR%"
"%NSSM%" set CHM-Nginx DisplayName "CHM Nginx Web Server"
"%NSSM%" set CHM-Nginx Start SERVICE_AUTO_START
"%NSSM%" set CHM-Nginx AppStopMethodConsole 3000

echo === Firewall: allow HTTP 80 in, keep 1857/8686 internal ===
netsh advfirewall firewall add rule name="CHM HTTP 80" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="CHM Block backend 1857 external" dir=in action=block protocol=TCP localport=1857 remoteip=any
netsh advfirewall firewall add rule name="CHM Block actuator 8686 external" dir=in action=block protocol=TCP localport=8686 remoteip=any

echo.
echo Services registered. Start them with start-all.bat
exit /b 0
