FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/i18n/package.json ./packages/i18n/
RUN pnpm install --frozen-lockfile --filter @ilanhub/admin...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages/i18n/node_modules ./packages/i18n/node_modules
COPY tsconfig.base.json ./
COPY packages/i18n ./packages/i18n
COPY apps/admin ./apps/admin
ARG VITE_API_URL=/api
ARG VITE_BASE=/admin/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE=$VITE_BASE
RUN pnpm --filter @ilanhub/i18n build && pnpm --filter @ilanhub/admin build

FROM nginx:alpine AS runner
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
