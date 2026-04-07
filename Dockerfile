# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy backend source
WORKDIR /app
COPY backend/ ./backend/

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "backend/server.js"]
