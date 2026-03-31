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
API_DOMAIN="${API_DOMAIN:-${DOMAIN:-}}"
WEB_DOMAIN="${WEB_DOMAIN:-}"
WWW_DOMAIN="${WWW_DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
APP_PATH="${APP_PATH:-/opt/west-drive}"
NGINX_CONF="/etc/nginx/sites-available/westdrive-api"
NGINX_LINK="/etc/nginx/sites-enabled/westdrive-api"

if [[ -z "${API_DOMAIN}" ]]; then
  echo "API_DOMAIN (or DOMAIN for backward compatibility) is required (example: api.your-domain.com)." >&2
  exit 1
fi

if [[ -n "${WEB_DOMAIN}" && -z "${WWW_DOMAIN}" ]]; then
  WWW_DOMAIN="www.${WEB_DOMAIN}"
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

# HTTP server blocks used first for validation/reverse-proxy.
if [[ -n "${WEB_DOMAIN}" ]]; then
  ${SUDO} tee "${NGINX_CONF}" >/dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${API_DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}

server {
  listen 80;
  listen [::]:80;
  server_name ${WEB_DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF

  if [[ -n "${WWW_DOMAIN}" ]]; then
    ${SUDO} tee -a "${NGINX_CONF}" >/dev/null <<EOF

server {
  listen 80;
  listen [::]:80;
  server_name ${WWW_DOMAIN};

  return 301 http://${WEB_DOMAIN}\$request_uri;
}
EOF
  fi
else
  ${SUDO} tee "${NGINX_CONF}" >/dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${API_DOMAIN};

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
fi

${SUDO} ln -sf "${NGINX_CONF}" "${NGINX_LINK}"
${SUDO} rm -f /etc/nginx/sites-enabled/default
${SUDO} nginx -t
${SUDO} systemctl reload nginx

echo "[provision] Requesting/renewing Let's Encrypt certificate..."
CERTBOT_DOMAINS=(-d "${API_DOMAIN}")
if [[ -n "${WEB_DOMAIN}" ]]; then
  CERTBOT_DOMAINS+=(-d "${WEB_DOMAIN}")
fi
if [[ -n "${WWW_DOMAIN}" ]]; then
  CERTBOT_DOMAINS+=(-d "${WWW_DOMAIN}")
fi

${SUDO} certbot --nginx \
  --non-interactive \
  --agree-tos \
  --expand \
  --email "${LETSENCRYPT_EMAIL}" \
  --redirect \
  "${CERTBOT_DOMAINS[@]}"

${SUDO} nginx -t
${SUDO} systemctl reload nginx

echo "[provision] Ensuring deploy directory exists..."
${SUDO} mkdir -p "${APP_PATH}/backend"
if [[ -n "${SUDO}" ]]; then
  ${SUDO} chown -R "${USER}:${USER}" "${APP_PATH}"
fi

echo "[provision] Completed successfully for API=${API_DOMAIN}${WEB_DOMAIN:+ WEB=${WEB_DOMAIN}}${WWW_DOMAIN:+ WWW=${WWW_DOMAIN}}."
