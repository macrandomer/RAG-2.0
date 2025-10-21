# File: backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm ci

# Copy source code AFTER installing deps
COPY . .

# Expose port
EXPOSE 5000

# Start dev server
CMD ["npm", "run", "dev"]
