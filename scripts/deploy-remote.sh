#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "==> Pull latest"
git fetch origin main
git reset --hard origin/main

echo "==> Build images"
"${COMPOSE[@]}" build

echo "==> Start data services"
"${COMPOSE[@]}" up -d postgres redis minio
sleep 8

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
  node:20-alpine sh -c '
    corepack enable && corepack prepare pnpm@9.15.4 --activate
    pnpm install --filter @ilanhub/database...
    pnpm db:push
  '

echo "==> Start all services"
"${COMPOSE[@]}" up -d

echo "==> Status"
"${COMPOSE[@]}" ps
curl -sf http://127.0.0.1/api/health && echo " — API OK" || echo "WARN: health check failed"
