FROM node:20-alpine AS builder
WORKDIR /app

# npm ci requires a package.json on disk for every workspace listed in the lockfile
COPY package*.json ./
COPY turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/workload-mock-ui/package.json apps/workload-mock-ui/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY apps/backend apps/backend

RUN npm run --workspace packages/shared build
RUN npm run --workspace apps/backend prisma:generate
RUN npm run --workspace apps/backend build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/workload-mock-ui/package.json apps/workload-mock-ui/package.json
COPY packages/shared/package.json packages/shared/package.json
# --omit=dev: prisma CLI is not installed, so skip lifecycle scripts; Prisma client is
# copied from the builder. Rebuild native addons (e.g. bcrypt) skipped by --ignore-scripts.
RUN npm ci --omit=dev --ignore-scripts --workspace apps/backend --workspace packages/shared
RUN npm rebuild bcrypt --workspace apps/backend

# prisma generate runs only in the builder; fresh npm ci leaves a stub client — copy generated output
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client /app/node_modules/@prisma/client

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma

EXPOSE 4000
CMD ["sh", "-c", "npm run --workspace apps/backend prisma:migrate:deploy && npm run --workspace apps/backend prisma:seed && node apps/backend/dist/main.js"]
