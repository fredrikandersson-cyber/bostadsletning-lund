# Builder stage - build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage - only runtime files
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy source files needed for tsx
COPY --from=builder /app/*.ts ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./

# Expose port
EXPOSE 3000

# Run server with tsx to execute TypeScript directly
CMD ["npx", "tsx", "server.ts"]
