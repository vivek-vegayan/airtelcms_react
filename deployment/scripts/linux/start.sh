#!/usr/bin/env bash
# CHM - start backend then nginx (run with sudo)
set -e
systemctl start chm-backend
systemctl start nginx
systemctl --no-pager status chm-backend nginx | head -20
