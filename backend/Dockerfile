FROM node:20-alpine

WORKDIR /app

# Install all dependencies (needed for build)
COPY package*.json ./
RUN npm ci

# Copy source code and configuration
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose Cloud Run port
EXPOSE 8080

# Start the application
# Option 1 (Recommended): Run migrations separately via Cloud Run Job
CMD ["node", "dist/index.js"]

# Option 2 (Alternative): Run migrations on startup (less stable)
# Uncomment the line below and comment out the line above if you need migrations on startup
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
