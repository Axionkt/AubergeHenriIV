# ---- Build stage ----
FROM node:22.14.0-slim AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:22.14.0-slim
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build

# Storage dir owned by the non-root user (named volume inherits this on first creation)
RUN mkdir -p /var/www/storage && chown node:node /var/www/storage

USER node
EXPOSE 3000
CMD ["npm", "start"]