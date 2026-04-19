FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY turbo.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
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
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --workspace apps/backend --workspace packages/shared

# prisma generate runs only in the builder; fresh npm ci leaves a stub client — copy generated output
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client /app/node_modules/@prisma/client

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma

EXPOSE 4000
CMD ["sh", "-c", "npm run --workspace apps/backend prisma:migrate:deploy && npm run --workspace apps/backend prisma:seed && node apps/backend/dist/main.js"]
