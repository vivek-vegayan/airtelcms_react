#!/usr/bin/env bash
# ============================================================================
# CHM - Deploy built artifacts on the Linux server. Run with sudo.
#  - React dist/        -> /var/www/chm/airtelchmbeta
#  - error pages        -> /var/www/chm/error-pages
#  - WAR                -> /opt/chm/app/airtelmanagement.war (previous kept as .bak)
#  - logback-linux.xml  -> /opt/chm/config/
# Restarts chm-backend and reloads nginx afterwards.
# ============================================================================
set -euo pipefail

FRONTEND_DIST="${FRONTEND_DIST:-$HOME/CHM_airtel_beta/dist}"
DEPLOY_SRC="${DEPLOY_SRC:-$HOME/CHM_airtel_beta/deployment}"
BACKEND_WAR="${BACKEND_WAR:-$HOME/airtelmanagement/target/airtelmanagement-0.0.1-SNAPSHOT.war}"

WWW_ROOT=/var/www/chm
APP_DIR=/opt/chm/app
CFG_DIR=/opt/chm/config

[[ -f "$FRONTEND_DIST/index.html" ]] || { echo "ERROR: $FRONTEND_DIST/index.html not found - run build.sh first"; exit 1; }
[[ -f "$BACKEND_WAR" ]]             || { echo "ERROR: $BACKEND_WAR not found - run build.sh first"; exit 1; }

echo "=== Stopping backend ==="
systemctl stop chm-backend || true

echo "=== Deploying frontend ==="
mkdir -p "$WWW_ROOT/airtelchmbeta" "$WWW_ROOT/error-pages"
rsync -a --delete "$FRONTEND_DIST/" "$WWW_ROOT/airtelchmbeta/"
rsync -a "$DEPLOY_SRC/config/error-pages/" "$WWW_ROOT/error-pages/"
chown -R nginx:nginx "$WWW_ROOT" 2>/dev/null || chown -R www-data:www-data "$WWW_ROOT"

echo "=== Deploying backend ==="
mkdir -p "$APP_DIR" "$CFG_DIR" /opt/chm/files_path /opt/chm/files_path2 /var/log/chm
[[ -f "$APP_DIR/airtelmanagement.war" ]] && cp -f "$APP_DIR/airtelmanagement.war" "$APP_DIR/airtelmanagement.war.bak"
cp -f "$BACKEND_WAR" "$APP_DIR/airtelmanagement.war"
cp -f "$DEPLOY_SRC/config/logback-linux.xml" "$CFG_DIR/"
chown -R chm:chm /opt/chm /var/log/chm
chmod 750 /opt/chm/app

if [[ ! -f /home/vegayan/simplus/config_airtel.properties ]]; then
    echo "WARNING: /home/vegayan/simplus/config_airtel.properties is MISSING."
    echo "         The backend will not start. Copy and fill the template from"
    echo "         deployment/config/airtelcms-config.sample.properties"
fi

echo "=== Starting services ==="
systemctl start chm-backend
nginx -t && systemctl reload nginx

echo
echo "DEPLOY OK - verify:"
echo "  curl -s http://127.0.0.1:8686/actuator/health"
echo "  curl -sI http://localhost/airtelchmbeta/"
