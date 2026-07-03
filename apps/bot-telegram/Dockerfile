FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/bot-telegram/package.json ./apps/bot-telegram/
COPY packages/shared/package.json ./packages/shared/
COPY packages/i18n/package.json ./packages/i18n/
RUN pnpm install --frozen-lockfile --filter @ilanhub/bot-telegram...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/i18n ./packages/i18n
COPY apps/bot-telegram ./apps/bot-telegram
RUN pnpm --filter @ilanhub/shared build && pnpm --filter @ilanhub/i18n build && pnpm --filter @ilanhub/bot-telegram build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/bot-telegram/dist ./dist
COPY --from=build /app/apps/bot-telegram/package.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
