FROM mcr.microsoft.com/playwright:v1.61.1-jammy

# Establish workspace
WORKDIR /usr/src/app

# Copy dependency graphs
COPY package*.json ./

# Install packages
RUN npm ci

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Expose API healthcheck port
EXPOSE 3000

# Start command
CMD ["node", "dist/index.js"]
