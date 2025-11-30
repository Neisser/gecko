FROM node:20-alpine

WORKDIR /app

# Install Prisma CLI globally
RUN npm install -g prisma

# Copy package files first (for better caching)
COPY package*.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm ci

# Copy Prisma configuration
COPY prisma.config.ts ./
COPY src/prisma ./src/prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# For development, docker-compose will override this with volumes
# For production, you would copy source and build here
CMD ["npm", "run", "dev"]