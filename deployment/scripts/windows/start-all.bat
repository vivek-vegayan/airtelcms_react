@echo off
REM CHM - start backend then nginx (run elevated)
net start CHM-Backend
net start CHM-Nginx
echo Verify: curl http://localhost/airtelchmbeta/
