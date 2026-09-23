@echo off
REM CHM - restart both services (run elevated)
net stop CHM-Nginx
net stop CHM-Backend
net start CHM-Backend
net start CHM-Nginx
echo Verify: curl http://localhost/airtelchmbeta/
