FROM node:20-slim

WORKDIR /app

# Install npm (already included with node)

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "run", "dev"]
