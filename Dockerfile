FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS backend-deps
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=backend-deps /app/server/node_modules ./server/node_modules
COPY --from=frontend-builder /app/dist ./dist
COPY server ./server

EXPOSE 3001

CMD ["node", "server/server.js"]
