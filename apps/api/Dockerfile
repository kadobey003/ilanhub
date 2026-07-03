FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/payments/package.json ./packages/payments/
COPY packages/watermark/package.json ./packages/watermark/
RUN pnpm install --frozen-lockfile --filter @ilanhub/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/payments/node_modules ./packages/payments/node_modules
COPY --from=deps /app/packages/watermark/node_modules ./packages/watermark/node_modules
COPY tsconfig.base.json turbo.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/payments ./packages/payments
COPY packages/watermark ./packages/watermark
COPY apps/api ./apps/api
RUN pnpm --filter @ilanhub/database build && \
    pnpm --filter @ilanhub/shared build && \
    pnpm --filter @ilanhub/payments build && \
    pnpm --filter @ilanhub/watermark build && \
    pnpm --filter @ilanhub/api build

FROM base AS deploy
COPY --from=build /app /app
WORKDIR /app
RUN pnpm deploy --filter=@ilanhub/api --prod /out

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy /out/ .
COPY --from=build /app/packages/watermark/assets ./node_modules/@ilanhub/watermark/assets
EXPOSE 3000
CMD ["node", "dist/main.js"]
