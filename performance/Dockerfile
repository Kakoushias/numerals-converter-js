FROM node:18-alpine

WORKDIR /app

# Copy and install backend dependencies
COPY backend/package*.json backend/tsconfig.json ./backend/
COPY backend/src ./backend/src/
RUN cd backend && npm ci

# Copy and install performance dependencies
COPY performance/package*.json ./performance/
RUN cd performance && npm ci

# Copy performance source
COPY performance/ ./performance/

# Set working directory to performance
WORKDIR /app/performance

# Run benchmark
CMD ["npm", "run", "benchmark"]

