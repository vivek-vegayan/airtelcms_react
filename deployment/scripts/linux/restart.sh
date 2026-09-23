#!/usr/bin/env bash
# CHM - restart backend, reload nginx config without dropping connections (run with sudo)
set -e
systemctl restart chm-backend
nginx -t && systemctl reload nginx
systemctl --no-pager status chm-backend | head -10
