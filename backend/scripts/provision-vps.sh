#!/usr/bin/env bash
set -euo pipefail

# Idempotent VPS bootstrap for WestDrive API:
# - installs Docker, Nginx, UFW, Certbot
# - configures firewall
# - configures Nginx reverse proxy for API subdomain
# - issues/renews Let's Encrypt cert and enables HTTPS redirect

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""
else
  SUDO="sudo"
fi

if ! command -v ${SUDO} >/dev/null 2>&1 && [[ -n "${SUDO}" ]]; then
  echo "sudo is required for provisioning." >&2
  exit 1
fi

DOMAIN="${DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
APP_PATH="${APP_PATH:-/opt/west-drive}"
NGINX_CONF="/etc/nginx/sites-available/westdrive-api"
NGINX_LINK="/etc/nginx/sites-enabled/westdrive-api"

if [[ -z "${DOMAIN}" ]]; then
  echo "DOMAIN is required (example: api.your-domain.com)." >&2
  exit 1
fi

if [[ -z "${LETSENCRYPT_EMAIL}" ]]; then
  echo "LETSENCRYPT_EMAIL is required for certbot." >&2
  exit 1
fi

echo "[provision] Installing required packages..."
${SUDO} apt-get update -y
${SUDO} apt-get install -y ca-certificates curl gnupg lsb-release nginx ufw certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  echo "[provision] Installing Docker..."
  curl -fsSL https://get.docker.com | ${SUDO} sh
fi

if [[ -n "${SUDO}" ]]; then
  ${SUDO} usermod -aG docker "${USER}" || true
fi

echo "[provision] Configuring firewall..."
${SUDO} ufw allow 22/tcp || true
${SUDO} ufw allow 80/tcp || true
${SUDO} ufw allow 443/tcp || true
${SUDO} ufw deny 3000/tcp || true
${SUDO} ufw --force enable

# HTTP-only server block used first for validation/reverse-proxy.
${SUDO} tee "${NGINX_CONF}" >/dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF

${SUDO} ln -sf "${NGINX_CONF}" "${NGINX_LINK}"
${SUDO} rm -f /etc/nginx/sites-enabled/default
${SUDO} nginx -t
${SUDO} systemctl reload nginx

echo "[provision] Requesting/renewing Let's Encrypt certificate..."
${SUDO} certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "${LETSENCRYPT_EMAIL}" \
  --redirect \
  -d "${DOMAIN}"

${SUDO} nginx -t
${SUDO} systemctl reload nginx

echo "[provision] Ensuring deploy directory exists..."
${SUDO} mkdir -p "${APP_PATH}/backend"
if [[ -n "${SUDO}" ]]; then
  ${SUDO} chown -R "${USER}:${USER}" "${APP_PATH}"
fi

echo "[provision] Completed successfully for ${DOMAIN}."
