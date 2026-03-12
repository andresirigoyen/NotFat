# Multi-stage Dockerfile for NotFat React Native development
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose ports
EXPOSE 3000 19006 19002

# Start development server
CMD ["npm", "start"]

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install system dependencies for SQLite
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S notfat -u 1001

# Change ownership of the app directory
RUN chown -R notfat:nodejs /app
USER notfat

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start:prod"]

# Database service stage
FROM postgres:15-alpine AS database
ENV POSTGRES_DB=notfat_db
ENV POSTGRES_USER=notfat
ENV POSTGRES_PASSWORD=notfat_password

# Expose PostgreSQL port
EXPOSE 5432

# Volume for data persistence
VOLUME ["/var/lib/postgresql/data"]

# Copy initialization scripts
COPY ./docker/init-db.sql /docker-entrypoint-initdb.d/
COPY ./docker/init-db.sh /docker-entrypoint-initdb.d/
