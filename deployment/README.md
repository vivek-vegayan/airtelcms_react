# CHM Airtel Scheduler — Production Deployment (Nginx, HTTP)

Deployment package for the CHM application:

| Component | Technology | Detail |
|-----------|-----------|--------|
| Frontend  | React 19 + Vite 7 (TypeScript) | Served under base path `/airtelchmbeta/` |
| Backend   | Spring Boot (executable WAR), Java 17 | Listens on `1857`, actuator on `8686` |
| Database  | MySQL (external, credentials via config file) | `airtelcms-config.properties` |
| Web server| Nginx | Reverse proxy + static file server, port `80` |
| Protocol  | HTTP (HTTPS optional, see [HTTPS-MIGRATION.md](HTTPS-MIGRATION.md)) |

## Architecture

```
Browser ──HTTP :80──▶ Nginx
                       ├── /airtelchmbeta/        → React static build (dist/)
                       ├── /changemanagementnew/  → proxy → Spring Boot 127.0.0.1:1857
                       └── /                      → redirect → /airtelchmbeta/
Spring Boot ──▶ MySQL, Remedy/Helix APIs, Cygnet, SSH/SFTP hosts
```

**Single-origin design (important):** the browser only ever talks to Nginx on port 80.
API calls use the relative base URL `/changemanagementnew` (set in `.env.production`),
so frontend and API share one origin and **CORS never applies**. The hardcoded CORS
allowlist in `SecurityConfig.java` is untouched and irrelevant for this topology —
no backend code change is required.

## Project facts discovered during analysis

1. **Build commands** — frontend: `npm run ready-hoja` (= `vite build`, output `dist/`);
   backend: `mvnw package` (produces `target/airtelmanagement-0.0.1-SNAPSHOT.war`,
   executable because `spring-boot-starter-tomcat` is *not* `provided`).
2. **Base path** — the SPA is served at `/airtelchmbeta/`, set via `VITE_APP_BASE_PATH` in
   `.env` / `.env.production` (read by `vite.config.ts`'s `base`; `BrowserRouter`'s
   `basename` in `src/App.tsx` derives from that same value at runtime, so the two can
   never drift apart). To retarget a deployment to a different sub-path (or `/`), change
   `VITE_APP_BASE_PATH` and rebuild - no source edit needed - and update the matching
   Nginx `location` blocks to the same path. Deep links like `/airtelchmbeta/roster/...`
   must fall back to `index.html` (handled in the Nginx configs).
3. **External runtime config (mandatory)** — `AppPropertiesConfig.java` reads:
   - Windows: `C:\vegayan\simplus\airtelcms-config.properties`
   - Linux: `/home/vegayan/simplus/config_airtel.properties`
   The backend **fails to start** if the file is missing. Template:
   [config/airtelcms-config.sample.properties](config/airtelcms-config.sample.properties).
4. **Windows-specific paths baked into the WAR** (must be overridden on Linux at launch,
   no rebuild needed):
   - `file.base.path=D:/files_path`, `file.base.path2=D:/files_path2` (application.properties)
   - logback `LOG_DIR=D:/CHM_LOGS` (override with external [config/logback-linux.xml](config/logback-linux.xml)
     via `--logging.config=`)
5. **Actuator** runs on a separate port `8686` — keep it firewalled (loopback only);
   it is intentionally *not* proxied by Nginx.
6. **JWT** is stateless (`Authorization` header), so no sticky sessions or cookie-path
   handling is needed in the proxy.
7. **Long-running operations** — the backend triggers SSH scripts and SFTP transfers,
   and Excel uploads exist (`EmployeeExcelController`). Nginx is configured with
   `client_max_body_size 1024m` and `proxy_read_timeout 300s`.

## Deployment-related improvements identified

| Finding | Action taken / recommendation |
|---------|------------------------------|
| API URL hardcoded to a dev IP in `.env` | Added `.env.production` with relative `/changemanagementnew` — used automatically by `vite build`, dev `.env` untouched |
| CORS allowlist of hardcoded IPs | Neutralized by same-origin topology (no code change). If you ever serve API on a different origin, add that origin to `SecurityConfig.java` |
| Secrets (JWT secret, Remedy passwords, API keys) inside `application.properties` in git | Works as-is; recommend moving them to the external config file in a future release |
| `logging.level.*=DEBUG` in `application.properties` | Overridden to INFO at launch via `--logging.level.com.vegayan.airtelmanagement=INFO` in the service definitions |
| No health-check endpoint proxied | Verification uses `http://127.0.0.1:8686/actuator/health` locally on the server |

## Package contents

```
deployment/
├── README.md                        ← this file
├── WINDOWS-DEPLOYMENT.md            ← step-by-step Windows Server guide
├── LINUX-DEPLOYMENT.md              ← step-by-step Linux (RHEL/Ubuntu) guide
├── HTTPS-MIGRATION.md               ← optional future HTTPS enablement
├── INSTRUCTIONS-HINGLISH.md         ← Hinglish quick guide (run/deploy/troubleshoot)
├── nginx/
│   ├── windows/nginx.conf           ← full nginx.conf for Windows
│   ├── linux/chm-airtel.conf        ← drop-in for /etc/nginx/conf.d/
│   └── https/chm-airtel-https.conf  ← reference config for future HTTPS
├── scripts/
│   ├── windows/  *.bat              ← build / deploy / service install / start-stop-restart
│   └── linux/    *.sh + chm-backend.service
└── config/
    ├── airtelcms-config.sample.properties
    ├── logback-linux.xml
    └── error-pages/50x.html
```

## Quick start

- **Windows:** follow [WINDOWS-DEPLOYMENT.md](WINDOWS-DEPLOYMENT.md)
- **Linux:** follow [LINUX-DEPLOYMENT.md](LINUX-DEPLOYMENT.md)
- **Verify:** each guide ends with a verification checklist (health check, login,
  SPA deep-link refresh, file upload).
