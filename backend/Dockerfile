FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 8080

# Run migrations and start app
CMD npx prisma migrate deploy && npm run dev
