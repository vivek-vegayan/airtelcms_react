# Linux Server Deployment Guide (HTTP) — RHEL 8/9 & Ubuntu 22.04/24.04

Target layout on the server:

```
/opt/chm/
├── app/airtelmanagement.war           Spring Boot executable WAR (+ .bak of previous)
├── config/logback-linux.xml           external logback (Linux log paths)
├── files_path/, files_path2/          replaces D:/files_path* via --file.base.path
/var/www/chm/
├── airtelchmbeta/                     React build (Vite dist/)
└── error-pages/50x.html
/home/vegayan/simplus/
├── config_airtel.properties           external runtime config (DB/SSH/SFTP) - REQUIRED
└── sftp_uploads/                      SFTP working dir (hardcoded in AppPropertiesConfig)
/var/log/chm/                          application logs
/etc/nginx/conf.d/chm-airtel.conf      site config
/etc/systemd/system/chm-backend.service
```

Only port **80** is exposed; 1857 (API) and 8686 (actuator) stay loopback-only.

---

## 1. Install prerequisites

```bash
# --- RHEL / Rocky / Alma ---
sudo dnf install -y java-17-openjdk nginx rsync
# --- Ubuntu / Debian ---
sudo apt update && sudo apt install -y openjdk-17-jre-headless nginx rsync

java -version           # expect 17.x
sudo systemctl enable nginx
```

### MySQL (only if the DB runs on this server)

```bash
# RHEL:   sudo dnf install -y mysql-server && sudo systemctl enable --now mysqld
# Ubuntu: sudo apt install -y mysql-server && sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

Create the schemas/user referenced by the config file (`DBSOURCE_USERMGMT_DBNAME`,
`DBSOURCE1_DBNAME`) and load your schema/seed SQL from the backend repo's
`db`/`sql` folders. If MySQL is remote, just verify reachability on 3306.

## 2. Application user & directories

```bash
sudo useradd --system --home /opt/chm --shell /usr/sbin/nologin chm

sudo mkdir -p /opt/chm/{app,config,files_path,files_path2} \
              /var/www/chm/{airtelchmbeta,error-pages} \
              /var/log/chm \
              /home/vegayan/simplus/sftp_uploads

sudo chown -R chm:chm /opt/chm /var/log/chm /home/vegayan/simplus
# nginx user is "nginx" on RHEL, "www-data" on Ubuntu:
sudo chown -R nginx:nginx /var/www/chm 2>/dev/null || sudo chown -R www-data:www-data /var/www/chm
```

## 3. External runtime configuration (mandatory)

The backend reads `/home/vegayan/simplus/config_airtel.properties` at startup
(hardcoded in `AppPropertiesConfig.java`) and **refuses to start without it**.

```bash
sudo cp deployment/config/airtelcms-config.sample.properties /home/vegayan/simplus/config_airtel.properties
sudo vi /home/vegayan/simplus/config_airtel.properties     # fill real DB/SSH/SFTP values
sudo chown chm:chm /home/vegayan/simplus/config_airtel.properties
sudo chmod 640 /home/vegayan/simplus/config_airtel.properties   # it holds passwords
```

## 4. Build

On the build machine, run [deployment/scripts/linux/build.sh](scripts/linux/build.sh)
(needs Node 20+ and JDK 17; paths configurable via `FRONTEND_DIR`/`BACKEND_DIR` env vars):

- Frontend: `npm ci && npm run ready-hoja` → `dist/`
  (`vite build` uses `.env.production` → API base `/changemanagementnew`, same origin, no CORS)
- Backend: `./mvnw clean package -DskipTests` → `target/airtelmanagement-0.0.1-SNAPSHOT.war`

If you build on Windows, copy `dist/`, the WAR, and the `deployment/` folder to the
server (scp/WinSCP), then continue below.

## 5. Install nginx site + systemd service (one-time)

```bash
# Nginx site
sudo cp deployment/nginx/linux/chm-airtel.conf /etc/nginx/conf.d/chm-airtel.conf
# RHEL: remove the default server block competing for port 80 if present
#   sudo vi /etc/nginx/nginx.conf   (delete/comment the default `server { ... }`)
# Ubuntu: sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# systemd unit (starts on boot via enable)
sudo cp deployment/scripts/linux/chm-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable chm-backend

# logrotate for application logs
sudo cp deployment/scripts/linux/chm-backend.logrotate /etc/logrotate.d/chm-backend
```

The unit file overrides the Windows-only settings baked into the WAR at launch —
no rebuild needed:
`--logging.config=/opt/chm/config/logback-linux.xml` (logback `LOG_DIR` was `D:/CHM_LOGS`),
`--file.base.path=/opt/chm/files_path`, `--file.base.path2=/opt/chm/files_path2`,
and `--logging.level.com.vegayan.airtelmanagement=INFO` (properties file says DEBUG).

## 6. Firewall & SELinux

```bash
# --- RHEL (firewalld) ---
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
# 1857/8686 are NOT opened -> unreachable from outside by default

# --- Ubuntu (ufw) ---
sudo ufw allow 80/tcp
sudo ufw enable

# --- SELinux (RHEL, enforcing) ---
# allow nginx to connect to the backend port:
sudo setsebool -P httpd_can_network_connect 1
# correct context for the web root:
sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/chm(/.*)?"
sudo restorecon -Rv /var/www/chm
```

## 7. Deploy

Run [deployment/scripts/linux/deploy.sh](scripts/linux/deploy.sh) with sudo. It:

1. Stops `chm-backend`.
2. rsyncs `dist/` → `/var/www/chm/airtelchmbeta/` (with `--delete`) and error pages.
3. Copies the WAR → `/opt/chm/app/airtelmanagement.war`, keeping the previous as `.bak`
   (rollback = `mv airtelmanagement.war.bak airtelmanagement.war && systemctl restart chm-backend`).
4. Installs `logback-linux.xml`, fixes ownership, warns if the external config is missing.
5. Starts `chm-backend`, validates and reloads nginx.

Day-to-day: [start.sh](scripts/linux/start.sh), [stop.sh](scripts/linux/stop.sh),
[restart.sh](scripts/linux/restart.sh), logs via `journalctl -u chm-backend -f`
and `/var/log/chm/`, nginx logs in `/var/log/nginx/chm-*.log` (rotated by the
distro's stock nginx logrotate entry).

## 8. Verification checklist

```bash
systemctl status chm-backend nginx                 # both active (running)

curl -s http://127.0.0.1:8686/actuator/health      # {"status":"UP"}

curl -si http://127.0.0.1:1857/auth/v1/signin -X POST \
     -H "Content-Type: application/json" -d '{}' | head -1
                                                   # 400/401 = backend reachable

curl -sI http://localhost/airtelchmbeta/ | head -1     # HTTP/1.1 200
curl -sI http://localhost/airtelchmbeta/deep/route | head -1   # 200 (SPA fallback)

curl -si http://localhost/changemanagementnew/auth/v1/signin -X POST \
     -H "Content-Type: application/json" -d '{}' | head -1
                                                   # same status as direct call

sudo reboot                                        # then re-check: both services up
```

From a workstation browser: `http://<server-ip>/airtelchmbeta/` → login, navigate,
refresh a deep link (no 404), upload an Excel file, confirm DevTools shows all API
calls on `/changemanagementnew/...` with no CORS errors.

## 9. Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `chm-backend` fails at boot: "Error loading configuration file" | `/home/vegayan/simplus/config_airtel.properties` missing or unreadable by user `chm` |
| 502 from nginx, backend running | SELinux blocking proxy → `setsebool -P httpd_can_network_connect 1` |
| 403/404 on static files | Wrong ownership/SELinux context on `/var/www/chm` → `restorecon -Rv` |
| Logs still trying `D:/CHM_LOGS` | `--logging.config` argument missing from the unit → `systemctl cat chm-backend` |
| API calls go to `192.168.0.x:1857` | Frontend built without `.env.production` — rebuild |
