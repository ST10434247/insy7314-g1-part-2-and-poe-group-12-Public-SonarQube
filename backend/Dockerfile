# Use the Node.js LTS runtime.
FROM node:20-bookworm-slim

# Set the application working directory.
WORKDIR /app

# Copy package manifests and install production dependencies only.
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy backend application source.
COPY backend/ ./backend/

# Create the application log directory and assign ownership.
RUN mkdir -p /app/logs && chown -R node:node /app

# Run the application as the non-root Node user.
USER node

# Configure the application environment.
ENV NODE_ENV=production
ENV PORT=3000
ENV SSL_KEY_PATH=/app/certs/key.pem
ENV SSL_CERT_PATH=/app/certs/cert.pem

# Expose the HTTPS API port.
EXPOSE 3000

# Start the backend server.
CMD ["node", "backend/server.js"]
