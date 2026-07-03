#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
DEPLOY_SHA="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}"

echo "==> Deploy $DEPLOY_SHA"

echo "==> Pull latest from GitHub"
git fetch origin main
git reset --hard origin/main

echo "==> Build images"
"${COMPOSE[@]}" build --pull

echo "==> Start data services"
"${COMPOSE[@]}" up -d postgres redis minio
sleep 10

echo "==> DB schema sync"
NET="$("${COMPOSE[@]}" ps -q postgres | xargs docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null | head -1)"
if [[ -z "$NET" ]]; then
  NET="$(docker network ls --format '{{.Name}}' | grep -E '_default$' | grep -i ilanhub | head -1)"
fi
if [[ -z "$NET" ]]; then
  echo "ERROR: docker network not found"
  exit 1
fi

docker run --rm --network "$NET" \
  -v "$ROOT:/app" -w /app \
  -e DATABASE_URL=postgresql://ilanhub:secret@postgres:5432/ilanhub \
  -e ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ilanhub.local}" \
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}" \
  node:20-alpine sh -c '
    corepack enable && corepack prepare pnpm@9.15.4 --activate
    pnpm install --filter @ilanhub/database...
    pnpm db:push
    pnpm db:seed
    pnpm db:seed-admin
  '

echo "==> Start all services"
"${COMPOSE[@]}" up -d --remove-orphans

echo "==> Wait for API"
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1/api/health >/dev/null 2>&1; then
    echo "API OK"
    break
  fi
  sleep 2
done

echo "==> Status"
"${COMPOSE[@]}" ps
curl -sf http://127.0.0.1/api/health && echo " — health OK" || {
  echo "ERROR: health check failed"
  docker logs ilanhub-api --tail 30
  exit 1
}

echo "==> Deploy done: $DEPLOY_SHA"
