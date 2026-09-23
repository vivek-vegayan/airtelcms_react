# CHM Deployment — Detailed Hinglish Guide (Examples ke saath)

Ye guide simple Hinglish me **har step detail me** batati hai — har command ke
saath **example output** bhi diya hai taaki tumhe pata rahe ki "sahi chala ya
nahi". English reference guides: [WINDOWS-DEPLOYMENT.md](WINDOWS-DEPLOYMENT.md),
[LINUX-DEPLOYMENT.md](LINUX-DEPLOYMENT.md), [HTTPS-MIGRATION.md](HTTPS-MIGRATION.md).

---

## Table of Contents

1. [Architecture samjho (2 minute)](#1-architecture-samjho)
2. [Windows Server deployment (full detail)](#2-windows-server-pe-deployment)
3. [Linux Server deployment (full detail)](#3-linux-server-pe-deployment)
4. [Naya version release kaise kare](#4-naya-version-release-kaise-kare)
5. [Troubleshooting — asli examples ke saath](#5-troubleshooting)
6. [Internet chahiye ya nahi](#6-internet-chahiye-ya-nahi)
7. [HTTPS baad me](#7-https-baad-me)

---

# 1. Architecture samjho

```
                         ┌─────────────────────────── SERVER ───────────────────────────┐
                         │                                                              │
 User ka browser ──────▶ │  Nginx (port 80)                                             │
 http://server-ip/       │    ├── /airtelchmbeta/        → React static files               │
                         │    │                            (C:\vegayan\simplus\www)     │
                         │    └── /changemanagementnew/  → Spring Boot backend          │
                         │                                 (127.0.0.1:1857)             │
                         │                                      │                       │
                         │                                      └──▶ MySQL              │
                         └──────────────────────────────────────────────────────────────┘
```

**3 baatein yaad rakho:**

1. **User sirf port 80 pe aata hai.** Backend ka port 1857 aur actuator ka 8686
   bahar se firewall me blocked hain. Ye security ke liye hai.
2. **Frontend aur API same origin pe hain** (dono port 80 se serve hote hain),
   isliye **CORS ka koi lafda nahi**. Backend me CORS config chhedne ki zarurat nahi.
3. Frontend build ke time [.env.production](../.env.production) use hota hai jisme
   `VITE_REACT_APP_BASE_URL=/changemanagementnew` likha hai — matlab API calls
   **relative path** pe jaati hain, kisi hardcoded IP pe nahi.

**Example — ek API call ka safar:**

```
Browser:  GET http://10.20.30.40/changemanagementnew/auth/v1/signin
          │
Nginx:    "/changemanagementnew/" prefix strip karke aage bhejta hai
          │
Backend:  GET http://127.0.0.1:1857/auth/v1/signin   ← backend ko apna native path milta hai
```

---

# 2. WINDOWS SERVER PE DEPLOYMENT

Kul 5 phases hain. **Phase 1, 2 aur 4 ka `install-services.bat` sirf EK BAAR**
karna hai (naya server setup). Uske baad roz sirf build + deploy.

## Phase 1 — Software install karo (sirf ek baar)

### 1a. Java 17 install karo

- https://adoptium.net kholo → **Temurin 17 (LTS)** → Windows x64 → `.msi` download.
- Installer me **"Set JAVA_HOME variable"** aur **"Add to PATH"** dono tick karo.

**Check karo (naya cmd kholke):**

```bat
java -version
```

**Expected output (example):**

```
openjdk version "17.0.11" 2024-04-16
OpenJDK Runtime Environment Temurin-17.0.11+9 (build 17.0.11+9)
```

`17.x` dikhna chahiye. Agar `'java' is not recognized` aaye to PATH set nahi
hua — installer dobara chalao ya System Environment Variables me daalo.

⚠️ **Note:** [install-services.bat](scripts/windows/install-services.bat) me Java
ka path `C:\Program Files\Java\jdk-17\bin\java.exe` likha hai. Agar tumhara
Java kahin aur install hua hai (Temurin usually
`C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\` me jaata hai), to
script kholke `JAVA_EXE` wali line me sahi path daal do. Path pata karne ke liye:

```bat
where java
```

**Example output:** `C:\Program Files\Eclipse Adoptium\jdk-17.0.11.9-hotspot\bin\java.exe`

### 1b. Nginx install karo

- https://nginx.org/en/download.html → **Stable version** ka Windows zip
  (e.g. `nginx-1.26.2.zip`) download karo.
- Zip extract karo aur folder ko rename/move karo taaki structure **exactly** ye ho:

```
C:\nginx\
   ├── nginx.exe        ← ye yaha hona chahiye, C:\nginx\nginx-1.26.2\nginx.exe NAHI
   ├── conf\
   ├── html\
   └── logs\
```

Ab **hamara config copy karo aur test karo** (repo folder se chalao):

```bat
copy deployment\nginx\windows\nginx.conf C:\nginx\conf\nginx.conf
C:\nginx\nginx.exe -t -p C:\nginx
```

**Expected output:**

```
nginx: the configuration file C:\nginx/conf/nginx.conf syntax is ok
nginx: configuration file C:\nginx/conf/nginx.conf test is successful
```

Agar `syntax is ok` na aaye to error message me line number hoga — config me
wahi line check karo (aksar path ka issue hota hai).

### 1c. NSSM install karo

NSSM = "Non-Sucking Service Manager". Ye Java aur Nginx ko **Windows service**
banata hai, taaki:
- Server restart hone pe app **apne aap start** ho
- Backend crash ho to **apne aap restart** ho (5 second baad)

Steps:
- https://nssm.cc/download se `nssm-2.24.zip` download karo
- Extract karke `win64\nssm.exe` ko copy karo → `C:\tools\nssm\nssm.exe`

**Check:**

```bat
C:\tools\nssm\nssm.exe version
```

**Expected output:** `NSSM 2.24 64-bit ...`

### 1d. MySQL (sirf agar DB isi server pe hai)

Agar database **kisi aur machine** pe already chal raha hai → **skip karo**,
sirf Phase 2 me us machine ka IP daalna.

Agar isi server pe chahiye:
- https://dev.mysql.com/downloads/installer/ se MySQL 8 installer
- "Server only" choose karo, root password set karo
- App ke liye alag user banao (root mat use karo):

```sql
CREATE USER 'chm_app'@'localhost' IDENTIFIED BY 'StrongPass@123';
GRANT ALL PRIVILEGES ON chm_db.* TO 'chm_app'@'localhost';
GRANT ALL PRIVILEGES ON usermgmt_db.* TO 'chm_app'@'localhost';
FLUSH PRIVILEGES;
```

Phir apna DB dump import karo:

```bat
mysql -u root -p chm_db < backup_chm_db.sql
```

---

## Phase 2 — Config file banao (sirf ek baar, COMPULSORY ⚠️)

**Ye sabse important step hai.** Backend startup pe
`C:\vegayan\simplus\airtelcms-config.properties` file padhta hai —
**ye file nahi mili to backend start hi nahi hoga** aur service turant band ho jayegi.

```bat
mkdir C:\vegayan\simplus
copy deployment\config\airtelcms-config.sample.properties C:\vegayan\simplus\airtelcms-config.properties
notepad C:\vegayan\simplus\airtelcms-config.properties
```

Notepad me file khulegi. **Example — bhari hui file kaisi dikhni chahiye:**

```properties
# ---- User-management / RBAC database ----
DBSOURCE_USERMGMT_IP=192.168.1.50          ← DB server ka IP (local ho to 127.0.0.1)
DBSOURCE_USERMGMT_USER=chm_app
DBSOURCE_USERMGMT_PASS=StrongPass@123      ← asli password (CHANGE_ME hata do!)
DBSOURCE_USERMGMT_DBNAME=usermgmt_db

# ---- Primary application database ----
DBSOURCE1_IP=192.168.1.50
DBSOURCE1_USER=chm_app
DBSOURCE1_PASS=StrongPass@123
DBSOURCE1_DBNAME=chm_db

# ---- SSH host 1 (shift generation, checkpoint refetch, PDF scripts) ----
SSH_HOST=192.168.1.60
SSH_PORT=22
SSH_USERNAME=scriptuser
SSH_PASSWORD=SshPass@456
SSH_SCRIPT_PATH=/home/scriptuser/scripts/main.sh
SSH_REFETCH_CHECKPOINT_SCRIPT_PATH=/home/scriptuser/scripts/refetch.sh
SSH_SHIFT_GEN_VAL_SCRIPT_PATH=/home/scriptuser/scripts/shiftgen.sh
SSH_PDF_VIEW_DOWNLOAD_PATH=/home/scriptuser/pdf/

# ---- SSH host 2 ----
SSH2_HOST=192.168.1.61
SSH2_PORT=22
SSH2_USERNAME=scriptuser2
SSH2_PASSWORD=SshPass@789
SSH2_SCRIPT_PATH=/home/scriptuser2/scripts/

# ---- SFTP (CRQ worklog files, raw JSON exchange) ----
SFTP_HOST=192.168.1.62
SFTP_USERNAME=sftpuser
SFTP_PASSWORD=SftpPass@111
SFTP_FILE_PATH=/data/chm/files/
SFTP_JSON_RAW_FILE_PATH=/data/chm/json_raw/
SFTP_FILE_PATH_CRQ_WEORKLOG_FILE=/data/chm/worklogs/
```

(Upar wale IPs/passwords **sirf example** hain — apne asli values daalo.)

**Rules:**
- Kahin bhi `CHANGE_ME` bacha nahi rehna chahiye
- SSH/SFTP details nahi pata? Khali chhod sakte ho — **login aur UI chalega**,
  lekin shift-generation aur CRQ file features fail honge
- File save karke Notepad band karo

---

## Phase 3 — Build karo

Build **internet wali machine pe** karna best hai (dependencies download hoti hain).

```bat
deployment\scripts\windows\build-all.bat
```

Ye script do kaam karta hai:

| Step | Kya hota hai | Output |
|------|-------------|--------|
| 1/2 Frontend | `npm ci` + `npm run ready-hoja` (Vite production build) | `dist\` folder |
| 2/2 Backend | `mvnw.cmd clean package -DskipTests` | `..\airtelmanagement\target\airtelmanagement-0.0.1-SNAPSHOT.war` |

**Expected output (last lines):**

```
=== [2/2] Building backend (Maven package, tests skipped) ===
[INFO] BUILD SUCCESS
[INFO] Total time:  01:45 min
Backend artifact: D:\...\airtelmanagement\target\airtelmanagement-0.0.1-SNAPSHOT.war

BUILD OK
```

**`BUILD OK` aana zaroori hai.** `BUILD FAILED` aaye to upar scroll karke pehla
red error padho.

⚠️ **Note:** Agar repo kisi aur path pe hai to
[build-all.bat](scripts/windows/build-all.bat) me upar `FRONTEND_DIR` /
`BACKEND_DIR` edit karo. Default:

```bat
set "FRONTEND_DIR=D:\CHM_airtel_scheduler\Github_Repo\CHM_airtel_beta"
set "BACKEND_DIR=D:\CHM_airtel_scheduler\Github_Repo\airtelmanagement"
```

**Build machine alag, server alag?** To build ke baad ye 3 cheezein server pe
copy karo (pen drive / network share se):
1. `CHM_airtel_beta\dist\` folder (pura)
2. `airtelmanagement\target\airtelmanagement-0.0.1-SNAPSHOT.war`
3. `CHM_airtel_beta\deployment\` folder (pura)

Server pe same paths pe rakho jo scripts expect karti hain, ya scripts ke
variables edit karo.

---

## Phase 4 — Deploy + Services banao

**Command Prompt ko Administrator me kholo:** Start menu → `cmd` type karo →
right-click **"Command Prompt"** → **"Run as administrator"**.

Phir ye teen commands **ek ke baad ek** chalao:

### 4a. Deploy

```bat
deployment\scripts\windows\deploy.bat
```

**Kya karta hai:**
- `dist\` → `C:\vegayan\simplus\www\airtelchmbeta\` copy (robocopy /MIR — purana saaf karke)
- WAR → `C:\vegayan\simplus\app\airtelmanagement.war` copy
- Error pages → `C:\vegayan\simplus\www\error-pages\`
- Runtime folders banata hai: `D:\files_path`, `D:\files_path2`, `D:\CHM_LOGS`,
  `C:\vegayan\simplus\sftp_uploads`
- Config file missing ho to **WARNING** print karta hai

**Expected output (end me):** `DEPLOY OK - verify: curl http://localhost/airtelchmbeta/ ...`

Pehli baar `net stop CHM-Backend` pe "service does not exist" jaisa message
aayega — **normal hai**, service abhi bani hi nahi.

### 4b. Services register karo (SIRF EK BAAR)

```bat
deployment\scripts\windows\install-services.bat
```

**Kya karta hai:**

| Cheez | Detail |
|-------|--------|
| `CHM-Backend` service | Java 17 se WAR chalata hai (`-Xms512m -Xmx2g`, timezone Asia/Kolkata). Crash pe 5 sec me auto-restart. Logs: `D:\CHM_LOGS\backend-stdout.log` / `backend-stderr.log` (10 MB pe rotate) |
| `CHM-Nginx` service | `C:\nginx\nginx.exe` chalata hai |
| Dono services | `SERVICE_AUTO_START` — **server reboot pe apne aap start** |
| Firewall | Port **80 allow** (users ke liye), **1857 aur 8686 block** (bahar se koi direct backend na chhed sake) |

**Expected output:**

```
=== Registering CHM-Backend (Spring Boot) ===
Service "CHM-Backend" installed successfully!
...
=== Registering CHM-Nginx ===
Service "CHM-Nginx" installed successfully!
...
Ok.
Ok.
Ok.

Services registered. Start them with start-all.bat
```

### 4c. Start karo

```bat
deployment\scripts\windows\start-all.bat
```

**Expected output:**

```
The CHM-Backend service is starting.
The CHM-Backend service was started successfully.
The CHM-Nginx service is starting.
The CHM-Nginx service was started successfully.
```

Backend ko puri tarah ready hone me **1–2 minute** lagte hain (Spring Boot +
DB connections). Sabar rakho.

**Services dekhne ke liye:** `services.msc` chalao → list me
"CHM Airtel Backend (Spring Boot)" aur "CHM Nginx Web Server" dikhengi,
Status = Running, Startup Type = Automatic.

---

## Phase 5 — Verify karo (har deploy ke baad)

### Test 1 — Backend zinda hai?

```bat
curl http://127.0.0.1:8686/actuator/health
```

**Expected:** `{"status":"UP"}`

- `{"status":"DOWN"}` aaye → DB connect nahi ho raha, config file ke DB values check karo
- `Connection refused` aaye → backend abhi start ho raha hai (1-2 min ruko) ya crash hua
  (`D:\CHM_LOGS\backend-stderr.log` padho)

### Test 2 — Nginx frontend serve kar raha hai?

```bat
curl -i http://localhost/airtelchmbeta/
```

**Expected (pehli lines):**

```
HTTP/1.1 200 OK
Server: nginx
Content-Type: text/html
...
<!doctype html><html lang="en">...
```

### Test 3 — API proxy chal raha hai?

```bat
curl -i http://localhost/changemanagementnew/auth/v1/signin -X POST -H "Content-Type: application/json" -d "{}"
```

**Expected:** koi bhi **JSON response** (400/401 bhi chalega — matlab request
backend tak pahunchi). `502 Bad Gateway` aaye to backend down hai.

### Test 4 — Browser se full test

Kisi bhi LAN machine ke browser me:

```
http://<server-ka-ip>/airtelchmbeta/
```

Example: `http://10.20.30.40/airtelchmbeta/`

Checklist:
- [ ] Login page dikha
- [ ] Login ho gaya (e.g. apna user ya test user)
- [ ] Kisi andar ke page pe jao (e.g. Roster) → **F5 refresh maro** → 404 NAHI aana chahiye (SPA routing test)
- [ ] Excel upload try karo (50 MB tak allowed hai)
- [ ] F12 → Network tab → API calls `/changemanagementnew/...` pe ja rahi hain, **koi CORS error nahi**, koi call `192.168.x.x:1857` pe nahi ja rahi

Sab ✅? **Deployment complete!** 🎉

---

## Windows — Roz ka kaam (cheat sheet)

| Kaam | Command (Administrator cmd) |
|------|------|
| Sab start | `deployment\scripts\windows\start-all.bat` |
| Sab band | `deployment\scripts\windows\stop-all.bat` |
| Restart | `deployment\scripts\windows\restart-all.bat` |
| Sirf backend restart | `net stop CHM-Backend` phir `net start CHM-Backend` |
| Sirf nginx reload (config change ke baad) | `C:\nginx\nginx.exe -p C:\nginx -s reload` |
| **Naya version deploy** | `build-all.bat` + `deploy.bat` — bas. Services khud handle ho jaati hain |
| Backend logs | `D:\CHM_LOGS\backend-stdout.log`, `backend-stderr.log` |
| Nginx logs | `C:\nginx\logs\access.log`, `error.log` |
| Live log dekhna (PowerShell) | `Get-Content D:\CHM_LOGS\backend-stdout.log -Tail 50 -Wait` |

---

# 3. LINUX SERVER PE DEPLOYMENT

RHEL/CentOS ke commands diye hain; Ubuntu ho to `dnf` ki jagah `apt` aur
`nginx` user ki jagah `www-data` (scripts dono handle karti hain).
Full English detail: [LINUX-DEPLOYMENT.md](LINUX-DEPLOYMENT.md).

## Step 1 — Software install (ek baar)

```bash
# RHEL / CentOS / Rocky:
sudo dnf install -y java-17-openjdk nginx rsync

# Ubuntu / Debian:
# sudo apt update && sudo apt install -y openjdk-17-jre nginx rsync
```

**Check:**

```bash
java -version    # → openjdk version "17.0.x"
nginx -v         # → nginx version: nginx/1.2x.x
```

MySQL bhi isi server pe chahiye to: `sudo dnf install -y mysql-server`,
phir `sudo systemctl enable --now mysqld`, phir wahi `CREATE USER` /
`GRANT` steps jo Windows section me diye hain.

## Step 2 — App user aur folders banao (ek baar)

Backend ko **root se nahi**, dedicated `chm` user se chalayenge (security best practice):

```bash
sudo useradd --system --home /opt/chm --shell /usr/sbin/nologin chm
sudo mkdir -p /opt/chm/{app,config,files_path,files_path2} /var/www/chm /var/log/chm /home/vegayan/simplus
sudo chown -R chm:chm /opt/chm /var/log/chm
```

**Folder structure samjho:**

```
/opt/chm/app/          ← WAR file yaha rahegi
/opt/chm/config/       ← logback-linux.xml (logging config)
/opt/chm/files_path/   ← file uploads (Windows ke D:\files_path ka equivalent)
/opt/chm/files_path2/  ← second files path
/var/www/chm/          ← React build (nginx yaha se serve karega)
/var/log/chm/          ← backend log files
/home/vegayan/simplus/ ← runtime config file
```

## Step 3 — Config file banao (ek baar, COMPULSORY ⚠️)

Linux pe config file ka path alag hai: `/home/vegayan/simplus/config_airtel.properties`

```bash
sudo cp deployment/config/airtelcms-config.sample.properties /home/vegayan/simplus/config_airtel.properties
sudo vi /home/vegayan/simplus/config_airtel.properties
```

`vi` me: `i` dabao (insert mode) → values bharo (same example jaise Windows
Phase 2 me dikhaya) → `Esc` → `:wq` → Enter.

Phir permissions tight karo (password wali file hai):

```bash
sudo chown chm:chm /home/vegayan/simplus/config_airtel.properties
sudo chmod 640 /home/vegayan/simplus/config_airtel.properties
```

## Step 4 — Nginx + systemd service install (ek baar)

```bash
sudo cp deployment/nginx/linux/chm-airtel.conf /etc/nginx/conf.d/
sudo cp deployment/scripts/linux/chm-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable chm-backend nginx     # ← reboot pe auto-start
```

**Log rotation bhi laga do** (logs disk na bhar dein):

```bash
sudo cp deployment/scripts/linux/chm-backend.logrotate /etc/logrotate.d/chm-backend
```

## Step 5 — Firewall + SELinux (ek baar, RHEL pe)

```bash
# Port 80 kholo users ke liye:
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# SELinux ko bolo ki nginx backend se baat kar sakta hai (RHEL pe zaroori,
# warna 502 aayega even though sab sahi hai):
sudo setsebool -P httpd_can_network_connect 1

# React files pe sahi SELinux context:
sudo semanage fcontext -a -t httpd_sys_content_t "/var/www/chm(/.*)?"
sudo restorecon -Rv /var/www/chm
```

Ubuntu pe firewall: `sudo ufw allow 80/tcp` (SELinux nahi hota, skip karo).

## Step 6 — Build + Deploy

```bash
./deployment/scripts/linux/build.sh        # frontend + backend build
sudo ./deployment/scripts/linux/deploy.sh  # server pe copy + services restart
```

`deploy.sh` default me repos ko `$HOME/CHM_airtel_beta` aur
`$HOME/airtelmanagement` pe dhundhta hai. Alag path pe hain to aise chalao:

```bash
sudo FRONTEND_DIST=/data/repos/CHM_airtel_beta/dist \
     DEPLOY_SRC=/data/repos/CHM_airtel_beta/deployment \
     BACKEND_WAR=/data/repos/airtelmanagement/target/airtelmanagement-0.0.1-SNAPSHOT.war \
     ./deployment/scripts/linux/deploy.sh
```

**Expected output (end):**

```
=== Starting services ===
nginx: configuration file /etc/nginx/nginx.conf test is successful

DEPLOY OK - verify:
  curl -s http://127.0.0.1:8686/actuator/health
  curl -sI http://localhost/airtelchmbeta/
```

deploy.sh ye bhi karta hai: purani WAR ka `.bak` backup rakhta hai, aur
`logback-linux.xml` copy karta hai (kyunki WAR ke andar wala logback Windows
ka `D:/CHM_LOGS` path use karta hai — Linux pe ye external file use hoti hai
jo `/var/log/chm/` me likhti hai).

## Step 7 — Verify

```bash
# Backend:
curl -s http://127.0.0.1:8686/actuator/health
# → {"status":"UP"}

# Frontend:
curl -sI http://localhost/airtelchmbeta/ | head -1
# → HTTP/1.1 200 OK

# Service status:
systemctl status chm-backend --no-pager
# → Active: active (running)
```

Phir browser test — same checklist jo Windows Phase 5 me hai.

## Linux — Roz ka kaam (cheat sheet)

| Kaam | Command |
|------|---------|
| Backend start/stop/restart | `sudo systemctl start/stop/restart chm-backend` |
| Nginx reload | `sudo systemctl reload nginx` |
| **Naya version deploy** | `./build.sh` + `sudo ./deploy.sh` (Step 6 dobara) |
| Live backend logs | `journalctl -u chm-backend -f` |
| Aaj ke backend errors | `journalctl -u chm-backend --since today -p err` |
| App log files | `ls /var/log/chm/` |
| Nginx logs | `/var/log/nginx/chm-access.log`, `chm-error.log` |
| Reboot ke baad sab up hai? | `systemctl status chm-backend nginx` |

---

# 4. NAYA VERSION RELEASE KAISE KARE

Setup ho jaane ke baad, har naye release me sirf itna:

**Windows:**

```bat
git pull                                        (dono repos me, agar server pe git hai)
deployment\scripts\windows\build-all.bat        ← BUILD OK aana chahiye
deployment\scripts\windows\deploy.bat           ← Administrator cmd me; DEPLOY OK
curl http://127.0.0.1:8686/actuator/health      ← {"status":"UP"}
```

**Linux:**

```bash
git pull
./deployment/scripts/linux/build.sh
sudo ./deployment/scripts/linux/deploy.sh
curl -s http://127.0.0.1:8686/actuator/health
```

Bas. Services register karna, firewall, config file — **kuch dobara nahi
karna**. Deploy script khud backend stop → copy → start karta hai.
Downtime sirf ~1-2 minute (backend restart ka time).

**Rollback chahiye (Linux)?** Purani WAR `.bak` me saved hai:

```bash
sudo cp /opt/chm/app/airtelmanagement.war.bak /opt/chm/app/airtelmanagement.war
sudo systemctl restart chm-backend
```

---

# 5. TROUBLESHOOTING

Har problem ke saath: **kaise pehchane → wajah → kya kare**.

### 5.1 — CHM-Backend service start hote hi band ho jaati hai

**Windows example:** `net start CHM-Backend` chalate ho, 10 second baad
`services.msc` me Status khali ho jaata hai.

**Sabse common wajah:** Phase 2 wali config file missing ya galat.

**Kya kare:** `D:\CHM_LOGS\backend-stderr.log` kholo (Linux:
`journalctl -u chm-backend -n 100`). **Example error aur matlab:**

```
java.io.FileNotFoundException: C:\vegayan\simplus\airtelcms-config.properties
```
→ Config file hai hi nahi. Phase 2 karo.

```
Communications link failure ... Connection refused
```
→ DB tak pahunch nahi raha. Config me `DBSOURCE1_IP` galat hai, ya MySQL band
hai, ya DB server ka firewall port 3306 block kar raha hai.
Test: `mysql -h 192.168.1.50 -u chm_app -p`

```
Access denied for user 'chm_app'@'...'
```
→ DB username/password galat hai. Config file me password check karo.

```
java.lang.UnsupportedClassVersionError: ... class file version 61.0
```
→ Java 17 nahi, purana Java chal raha hai. `where java` / `java -version` check
karo, `install-services.bat` me `JAVA_EXE` path sahi karo, service dobara
register karo.

### 5.2 — Browser me 502 Bad Gateway

**Matlab:** Nginx chal raha hai, lekin backend (1857) jawab nahi de raha.

1. Backend abhi boot ho raha hai? → 1-2 min ruko, phir refresh
2. `curl http://127.0.0.1:8686/actuator/health` → Connection refused? Backend
   down hai → start karo (`net start CHM-Backend` / `sudo systemctl start chm-backend`)
3. **RHEL Linux special:** health UP hai, phir bhi 502? → SELinux nginx ko rok
   raha hai. Check: `sudo grep denied /var/log/audit/audit.log | grep nginx`
   Fix: `sudo setsebool -P httpd_can_network_connect 1`

### 5.3 — `/airtelchmbeta/` pe blank white page

F12 → Console kholo. **Example error:**

```
Failed to load resource: net::ERR_ABORTED 404  /airtelchmbeta/assets/index-Cx4T9dka.js
```

→ `index.html` naya hai lekin assets purane (ya deploy adhura hua).
**Fix:** `deploy.bat` / `deploy.sh` dobara chalao, phir browser me
**Ctrl+Shift+R** (hard refresh).

### 5.4 — API calls `192.168.0.x:1857` jaise direct IP pe ja rahi hain

F12 → Network me requests `http://192.168.0.35:1857/...` pe dikh rahi hain
(aur fail ho rahi hain).

**Wajah:** Build production mode me nahi hua — dev `.env` ki values baked ho
gayi. Production me `VITE_REACT_APP_BASE_URL=/changemanagementnew` hona
chahiye ([.env.production](../.env.production)).

**Fix:** `.env.production` file confirm karo, phir `build-all.bat` /
`build.sh` se **dobara build** + deploy. (Vite build-time values baked karta
hai — sirf file badalna kaafi nahi, rebuild zaroori hai.)

### 5.5 — Andar ke page pe F5 refresh karne pe 404

**Example:** `http://server/airtelchmbeta/roster/weekly` pe ho, F5 dabaya → nginx ka 404.

**Wajah:** Nginx me SPA fallback (`try_files ... /airtelchmbeta/index.html`) wala
config load nahi hua — purana/default config chal raha hai.

**Fix (Windows):**

```bat
copy deployment\nginx\windows\nginx.conf C:\nginx\conf\nginx.conf
C:\nginx\nginx.exe -t -p C:\nginx
deployment\scripts\windows\restart-all.bat
```

**Fix (Linux):** conf.d wali file dobara copy karo, `sudo nginx -t`,
`sudo systemctl reload nginx`.

### 5.6 — Port 80 pehle se occupied (nginx start nahi hota)

Nginx error log me: `bind() to 0.0.0.0:80 failed (10013: An attempt was made...)`

**Kaun le raha hai port 80:**

```bat
netstat -ano | findstr :80 | findstr LISTENING
```

**Example output:**

```
TCP    0.0.0.0:80    0.0.0.0:0    LISTENING    4
```

Last column = PID. `4` matlab System (aksar **IIS**). Fix:

```bat
REM IIS band karo:
iisreset /stop
sc config W3SVC start= disabled
```

Skype ya koi aur app ho to Task Manager me PID se dhundo aur band karo.
Linux pe: `sudo ss -ltnp | grep :80` (aksar Apache — `sudo systemctl disable --now httpd`).

### 5.7 — Excel upload fail: "413 Request Entity Too Large"

Nginx me upload limit **1024 MB (1 GB)** set hai (`client_max_body_size 1024m`). Isse
badi file chahiye to nginx config me ye value badhao, `nginx -t`, phir reload.
Agar backend (Spring Boot) apna alag `spring.servlet.multipart.max-file-size` /
`max-request-size` set karta hai, wo bhi is se badhana padega — nginx sirf
proxy-level limit hai, backend apna khud ka limit reject kar sakta hai.

### 5.8 — Login ke baad turant logout / token issues

Backend logs me JWT errors dekho. Agar deploy ke baad purane tokens invalid
ho gaye hain to users ko dobara login karna hoga — ye normal hai. (Test ke
liye `AUTH_JWT_TOKENS` table clear kar sakte ho.)

---

# 6. INTERNET CHAHIYE YA NAHI?

| Cheez | Internet chahiye? |
|-------|-------------------|
| App **chalane** ke liye | ❌ NAHI — sab local hai (Nginx + React build + Spring Boot + MySQL). Users ko sirf LAN se server ka port 80 chahiye |
| **Build** karne ke liye | ✅ HAAN (npm + Maven dependencies) — isliye build internet wali machine pe karo, phir `dist\`, WAR, aur `deployment\` folder server pe copy karo |
| **Kuch features** ke liye | Intranet routes chahiye: Remedy/Helix API (`helixitsm.api.airtel.com`), Cygnet (`172.30.76.100`), SSH/SFTP servers. Ye na milein to login/UI chalega lekin CRQ create/cancel aur shift-generation fail honge |

---

# 7. HTTPS BAAD ME CHAHIYE TO?

Abhi sab **HTTP** pe hai aur poori tarah kaam karta hai. Baad me HTTPS lagana
ho to [HTTPS-MIGRATION.md](HTTPS-MIGRATION.md) follow karo. Short me:

1. SSL certificate lo (company CA se ya Let's Encrypt se)
2. Ready-made HTTPS config already bana hua hai:
   [deployment/nginx/https/chm-airtel-https.conf](nginx/https/chm-airtel-https.conf)
   — sirf certificate paths bharne hain
3. Nginx reload karo

**Sabse achhi baat:** sirf **Nginx config** change hota hai. Frontend/backend
ko **dobara build karne ki zarurat NAHI** — kyunki API base URL relative
(`/changemanagementnew`) hai, wo `http://` ho ya `https://`, dono pe waise hi
chalta hai. Backend ko bhi `X-Forwarded-Proto` header se pata chal jaata hai.

---

*Koi step atak jaye to pehle Section 5 (Troubleshooting) dekho — 90% problems
wahi cover ho jaati hain.*
