# Production Stage 1: Build the assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage 2: Final runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port and start
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", "dist/server.cjs"]
