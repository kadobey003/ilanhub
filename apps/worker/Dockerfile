FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/watermark/package.json ./packages/watermark/
RUN pnpm install --frozen-lockfile --filter @ilanhub/worker...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/watermark ./packages/watermark
COPY apps/worker ./apps/worker
RUN pnpm --filter @ilanhub/database build && pnpm --filter @ilanhub/watermark build && pnpm --filter @ilanhub/worker build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/worker/dist ./dist
COPY --from=build /app/packages/watermark/assets ./node_modules/@ilanhub/watermark/assets
COPY --from=build /app/apps/worker/package.json ./
COPY --from=deps /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
