# Optional HTTPS Migration Guide (future)

The current deployment is HTTP-only and works as documented. This guide enables
HTTPS **later** with zero application-architecture changes: TLS terminates at
Nginx, the backend keeps speaking plain HTTP on `127.0.0.1:1857`, and the frontend
keeps its relative API base URL (`/changemanagementnew`), which automatically
becomes `https://...` when the page is served over HTTPS. **No rebuild of the
frontend or backend is required.**

Reference config: [nginx/https/chm-airtel-https.conf](nginx/https/chm-airtel-https.conf).

---

## 1. Get a certificate

**Option A — Corporate / internal CA (typical for Airtel intranet):**
obtain `chm.example.com.crt` (full chain) and `chm.example.com.key` from your CA team.

**Option B — Let's Encrypt (server must be reachable on a public DNS name):**

```bash
# Linux
sudo dnf install -y certbot python3-certbot-nginx   # RHEL (EPEL) / apt on Ubuntu
sudo certbot --nginx -d chm.example.com
```

Certificate placement:

| OS | Certificate | Key |
|----|------------|-----|
| Linux (corporate CA) | `/etc/pki/tls/certs/chm.crt` | `/etc/pki/tls/private/chm.key` (chmod 600, root) |
| Linux (Let's Encrypt) | `/etc/letsencrypt/live/<host>/fullchain.pem` | `.../privkey.pem` (managed by certbot) |
| Windows | `C:\nginx\certs\chm.crt` | `C:\nginx\certs\chm.key` (NTFS: Administrators + service account only) |

## 2. Switch the Nginx config

1. Take the HTTPS reference config, set your real `server_name` and certificate paths.
2. **Linux:** replace `/etc/nginx/conf.d/chm-airtel.conf` with it →
   `sudo nginx -t && sudo systemctl reload nginx`.
   **Windows:** merge its two `server` blocks into `C:\nginx\conf\nginx.conf`
   (replacing the existing `server` block), adjust paths to `C:/...`, then
   `nginx -t -p C:\nginx` and restart `CHM-Nginx`.
3. Open port 443 in the firewall
   (Linux: `firewall-cmd --permanent --add-service=https && firewall-cmd --reload` or `ufw allow 443/tcp`;
   Windows: `netsh advfirewall firewall add rule name="CHM HTTPS 443" dir=in action=allow protocol=TCP localport=443`).

What the config changes:

- Port 80 becomes a **301 redirect to HTTPS** (keeping `/.well-known/acme-challenge/`
  reachable over HTTP for certbot renewals).
- Port 443 serves the same SPA + API proxy blocks as the HTTP config.
- `proxy_set_header X-Forwarded-Proto $scheme` now passes `https`, so any
  backend-generated absolute URLs are scheme-correct.
- `Strict-Transport-Security` (HSTS) is enabled — remove that header first if you
  are only trialing HTTPS, since browsers cache it.

## 3. Spring Boot changes

**None required.** The app is stateless JWT over the `Authorization` header, TLS
terminates at Nginx, and the backend stays on loopback HTTP. Two optional notes:

- If you ever set auth cookies, add `server.servlet.session.cookie.secure=true`.
- The CORS allowlist in `SecurityConfig.java` remains irrelevant because the
  origin is still shared between SPA and API.

## 4. Certificate renewal

- **Let's Encrypt:** `certbot renew` runs automatically via systemd timer; verify
  with `sudo certbot renew --dry-run`. Nginx reload happens via certbot's hook.
- **Corporate CA:** diarize the expiry; replace the `.crt`/`.key` files and run
  `nginx -s reload` (Windows: `nginx.exe -p C:\nginx -s reload`). Check expiry with
  `openssl x509 -enddate -noout -in chm.crt`.

## 5. Migration steps summary (HTTP → HTTPS)

1. Obtain certificate + key, place per table above.
2. Deploy the HTTPS Nginx config, `nginx -t`, reload.
3. Open 443 in the firewall.
4. Browse `https://<host>/airtelchmbeta/` — login and API calls must work unchanged.
5. Confirm `http://` URLs redirect to `https://`.
6. (After confidence) keep HSTS enabled; set up renewal.

Rollback: restore the HTTP config file, reload Nginx, close 443. Nothing in the
application itself changed, so rollback is Nginx-only.
