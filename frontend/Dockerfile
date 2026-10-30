
# Build stage: compile the React application.
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install frontend dependencies.
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and create production build.
COPY frontend/ ./
RUN npm run build

# Production stage: serve the build using Nginx.
FROM nginx:1.27-alpine

# Copy the production build into Nginx's web directory.
COPY --from=build /app/build /usr/share/nginx/html

# Copy the custom Nginx configuration.
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
