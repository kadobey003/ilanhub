FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
RUN pnpm install --filter @ilanhub/api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY tsconfig.base.json turbo.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN pnpm --filter @ilanhub/database build && pnpm --filter @ilanhub/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/database/dist ./node_modules/@ilanhub/database/dist
COPY --from=build /app/packages/database/package.json ./node_modules/@ilanhub/database/
EXPOSE 3000
CMD ["node", "dist/main.js"]
