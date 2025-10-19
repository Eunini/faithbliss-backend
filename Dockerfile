# Use Node.js 18 Debian Bookworm Slim (includes OpenSSL 3)
FROM node:18-bookworm-slim

# Install dependencies required for Prisma and NestJS
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Generate Prisma client (ensure it’s built with debian-openssl-3.0.x support)
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the NestJS app
RUN npm run build

# Create non-root user for security
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -s /bin/bash -m nestjs \
    && chown -R nestjs:nodejs /usr/src/app

USER nestjs

# Expose app port
EXPOSE 3001

# Copy entrypoint and make it executable (entrypoint runs migrations then starts the app)
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/src/app/docker-entrypoint.sh
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Use entrypoint script as the container command
CMD ["/usr/src/app/docker-entrypoint.sh"]