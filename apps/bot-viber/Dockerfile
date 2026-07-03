FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/bot-viber/package.json ./apps/bot-viber/
COPY packages/shared/package.json ./packages/shared/
COPY packages/i18n/package.json ./packages/i18n/
RUN pnpm install --frozen-lockfile --filter @ilanhub/bot-viber...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/bot-viber/node_modules ./apps/bot-viber/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/i18n/node_modules ./packages/i18n/node_modules
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/i18n ./packages/i18n
COPY apps/bot-viber ./apps/bot-viber
RUN pnpm --filter @ilanhub/shared build && pnpm --filter @ilanhub/i18n build && pnpm --filter @ilanhub/bot-viber build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/bot-viber/dist ./dist
COPY --from=build /app/apps/bot-viber/package.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/main.js"]
