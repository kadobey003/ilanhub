#!/usr/bin/env bash
# One-time VPS bootstrap. Run on server as ubuntu user.
set -euo pipefail

REPO_URL="${1:-https://github.com/kadobey003/ilanhub.git}"
APP_DIR="$HOME/ilanhub"
PUBLIC_URL="${PUBLIC_URL:-http://$(curl -sf ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"

echo "==> Install Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER" 2>/dev/null || true
sudo apt-get update -qq
sudo apt-get install -y -qq git docker-compose-plugin 2>/dev/null || true

echo "==> Clone repo"
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Create .env"
if [[ ! -f .env ]]; then
  JWT="$(openssl rand -hex 32)"
  BOT_SECRET="$(openssl rand -hex 16)"
  cat > .env <<EOF
DATABASE_URL=postgresql://ilanhub:secret@postgres:5432/ilanhub
REDIS_URL=redis://redis:6379
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
JWT_SECRET=${JWT}
ADMIN_EMAIL=admin@ilanhub.local
ADMIN_PASSWORD=admin123
PUBLIC_URL=${PUBLIC_URL}
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=ilanhub_bot
TELEGRAM_ADMIN_CHAT_ID=
BOT_INTERNAL_SECRET=${BOT_SECRET}
VIBER_AUTH_TOKEN=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=ilanhub
DEFAULT_LOCALE=uk
DEFAULT_CURRENCY=UAH
EOF
  echo "Created .env — edit TELEGRAM_BOT_TOKEN etc."
fi

if [[ ! -f docker-compose.override.yml ]]; then
  BOT_SECRET="$(grep '^BOT_INTERNAL_SECRET=' .env | cut -d= -f2-)"
  cat > docker-compose.override.yml <<EOF
services:
  api:
    environment:
      PUBLIC_URL: ${PUBLIC_URL}
      BOT_INTERNAL_SECRET: ${BOT_SECRET}
  worker:
    environment:
      PUBLIC_URL: ${PUBLIC_URL}
  bot-telegram:
    environment:
      PUBLIC_URL: ${PUBLIC_URL}
      BOT_INTERNAL_SECRET: ${BOT_SECRET}
EOF
fi

echo "==> Firewall"
sudo ufw allow OpenSSH 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

echo "==> First deploy"
bash scripts/deploy-remote.sh

# seed only on first run
docker run --rm --network "$(docker network ls --format '{{.Name}}' | grep -i ilanhub | head -1)" \
  -v "$APP_DIR:/app" -w /app \
  -e DATABASE_URL=postgresql://ilanhub:secret@postgres:5432/ilanhub \
  node:20-alpine sh -c '
    corepack enable && corepack prepare pnpm@9.15.4 --activate
    pnpm install --filter @ilanhub/database...
    pnpm db:seed || true
    pnpm db:seed-admin || true
  ' 2>/dev/null || true

echo ""
echo "Done: ${PUBLIC_URL}"
echo "Admin: ${PUBLIC_URL}/admin"
