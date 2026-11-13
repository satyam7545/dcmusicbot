# Build Stage
FROM node:22-bookworm AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy project files
COPY . .

# Build React client and bundle server
RUN npm run build

# Production Runtime Stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime system packages for audio and process management
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    dumb-init \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create non-root user for security
RUN groupadd -r harmonix && useradd -r -g harmonix harmonix \
    && mkdir -p /app/logs && chown -R harmonix:harmonix /app

USER harmonix

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
