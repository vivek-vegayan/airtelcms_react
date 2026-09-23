# Windows Server Deployment Guide (HTTP)

Target layout on the server:

```
C:\Program Files\Java\jdk-17\          Java 17 (Temurin)
C:\nginx\                              Nginx for Windows
C:\tools\nssm\nssm.exe                 NSSM service manager
C:\vegayan\simplus\
├── airtelcms-config.properties        external runtime config (DB/SSH/SFTP) - REQUIRED
├── app\airtelmanagement.war           Spring Boot executable WAR
├── www\airtelchmbeta\                 React build (Vite dist/)
├── www\error-pages\50x.html           custom error page
└── sftp_uploads\                      SFTP working dir (hardcoded in AppPropertiesConfig)
D:\files_path, D:\files_path2          CSV/file paths (application.properties)
D:\CHM_LOGS\                           application logs (logback LOG_DIR)
```

Services: `CHM-Backend` (Java via NSSM) and `CHM-Nginx` (nginx via NSSM), both auto-start.
Only port **80** is exposed; 1857 (API) and 8686 (actuator) stay loopback-only.

---

## 1. Install prerequisites

### Java 17
1. Download Eclipse Temurin 17 (LTS) MSI: https://adoptium.net/temurin/releases/?version=17
2. Install to `C:\Program Files\Java\jdk-17` (tick "Set JAVA_HOME" and "Add to PATH").
3. Verify: `java -version` → `openjdk 17.x`.

### Nginx
1. Download the stable Windows zip from https://nginx.org/en/download.html
2. Extract so that `C:\nginx\nginx.exe` exists.
3. Replace `C:\nginx\conf\nginx.conf` with [deployment/nginx/windows/nginx.conf](nginx/windows/nginx.conf).
4. Test: `C:\nginx\nginx.exe -t -p C:\nginx` → "syntax is ok / test is successful".

### NSSM (service manager)
1. Download from https://nssm.cc/download, extract `win64\nssm.exe` to `C:\tools\nssm\`.

### MySQL (only if the DB runs on this server)
1. Install MySQL 8.x Community Server as a Windows service (default: auto-start).
2. Create the schemas and app user referenced by the config file
   (`DBSOURCE_USERMGMT_DBNAME`, `DBSOURCE1_DBNAME`), and load your schema/seed SQL
   from the backend repo's `db`/`sql` folders as applicable.
3. If MySQL is remote, just ensure this server can reach it on 3306.

---

## 2. External runtime configuration (mandatory)

The backend reads `C:\vegayan\simplus\airtelcms-config.properties` at startup and
**refuses to start without it** (see `AppPropertiesConfig.java`).

```bat
mkdir C:\vegayan\simplus
copy deployment\config\airtelcms-config.sample.properties C:\vegayan\simplus\airtelcms-config.properties
notepad C:\vegayan\simplus\airtelcms-config.properties   :: fill real DB/SSH/SFTP values
```

Restrict the folder to Administrators + the service account (it holds passwords):
`icacls C:\vegayan\simplus /inheritance:d /remove Users`

---

## 3. Build

On the build machine (can be the server itself), run
[deployment/scripts/windows/build-all.bat](scripts/windows/build-all.bat):

- Frontend: `npm ci && npm run ready-hoja` → `dist/`
  (`vite build` automatically uses `.env.production`, which sets
  `VITE_REACT_APP_BASE_URL=/changemanagementnew` — the relative, same-origin API base)
- Backend: `mvnw.cmd clean package -DskipTests` →
  `target\airtelmanagement-0.0.1-SNAPSHOT.war`

---

## 4. Deploy

Run [deployment/scripts/windows/deploy.bat](scripts/windows/deploy.bat) **as Administrator**. It:

1. Stops `CHM-Backend` (no-op on first deploy).
2. Mirrors `dist\` → `C:\vegayan\simplus\www\airtelchmbeta` and error pages → `www\error-pages`.
3. Copies the WAR → `C:\vegayan\simplus\app\airtelmanagement.war`.
4. Creates `D:\files_path`, `D:\files_path2`, `D:\CHM_LOGS`, `sftp_uploads` if missing.
5. Warns if the external config file is missing.
6. Restarts the services and reloads Nginx.

---

## 5. Register Windows services (one-time)

Run [deployment/scripts/windows/install-services.bat](scripts/windows/install-services.bat)
**as Administrator**. It registers:

- **CHM-Backend** — `java -Xms512m -Xmx2g -XX:+UseG1GC -jar airtelmanagement.war`
  with `--logging.level.com.vegayan.airtelmanagement=INFO` (overrides the DEBUG levels
  in `application.properties`), auto-restart on crash, stdout/stderr rotated in `D:\CHM_LOGS`.
- **CHM-Nginx** — nginx as a service with graceful console stop.
- **Firewall rules** — allow TCP 80 inbound; explicitly block external access to
  1857 and 8686.

Both services are `SERVICE_AUTO_START`, so they **start on boot**.

Day-to-day control: [start-all.bat](scripts/windows/start-all.bat),
[stop-all.bat](scripts/windows/stop-all.bat), [restart-all.bat](scripts/windows/restart-all.bat)
(or `services.msc`).

---

## 6. Verification checklist

Run on the server:

```bat
:: 1. Backend is up (actuator, loopback only)
curl http://127.0.0.1:8686/actuator/health
::    expect {"status":"UP"}

:: 2. Backend answers directly
curl -i http://127.0.0.1:1857/auth/v1/signin -X POST -H "Content-Type: application/json" -d "{}"
::    expect 400/401 (reachable; bad credentials is fine)

:: 3. Nginx serves the SPA
curl -i http://localhost/airtelchmbeta/
::    expect 200 + HTML containing /airtelchmbeta/assets/...

:: 4. Nginx proxies the API (prefix stripped)
curl -i http://localhost/changemanagementnew/auth/v1/signin -X POST -H "Content-Type: application/json" -d "{}"
::    expect same status as step 2

:: 5. SPA deep-link fallback
curl -i http://localhost/airtelchmbeta/some/deep/route
::    expect 200 + index.html
```

From a workstation browser: `http://<server-ip>/airtelchmbeta/` → login page loads,
sign in works, refresh on an inner page does **not** 404, an Excel upload succeeds,
and DevTools shows API calls going to `http://<server-ip>/changemanagementnew/...`
with **no CORS errors**.

---

## 7. Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| CHM-Backend stops immediately | Missing/invalid `C:\vegayan\simplus\airtelcms-config.properties` — check `D:\CHM_LOGS\backend-stderr.log` |
| 502 from Nginx | Backend not running or still starting — check `net start CHM-Backend`, actuator health |
| Blank page at `/airtelchmbeta/` | dist not deployed to `www\airtelchmbeta`, or build made without `.env.production` |
| API calls hit dev IP `192.168.0.x:1857` | Frontend built with the dev `.env` — confirm `.env.production` exists, rebuild |
| Login OK but refresh 404s | `try_files ... /airtelchmbeta/index.html` missing from nginx.conf |
| `<Router basename="..."> is not able to match the URL` | Stale `dist/` served under a URL/Nginx path that no longer matches the `VITE_APP_BASE_PATH` it was built with — rebuild (`npm run ready-hoja`) after any `VITE_APP_BASE_PATH` or Nginx path change and redeploy |
