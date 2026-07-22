FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DATA_DIR=/data

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/

RUN npm ci --omit=dev

COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/web/dist ./web/dist

EXPOSE 3000

CMD ["sh", "-c", "node server/dist/seed.js && node server/dist/index.js"]
