FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
COPY turbo.json tsconfig.base.json ./
# Lockfile includes all workspaces — each needs its package.json for npm ci
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/workload-mock-ui/package.json apps/workload-mock-ui/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/frontend apps/frontend

RUN npm run --workspace packages/shared build
RUN npm run --workspace apps/frontend build

FROM nginx:1.27-alpine AS runner
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
