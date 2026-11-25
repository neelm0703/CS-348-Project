# Stage 1: build the React app into static files (dist/).
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# Stage 2: serve the static files with nginx and proxy /api/ to the backend.
FROM nginx:1.27-alpine

# The nginx image fills ${VAR}s in /etc/nginx/templates/*.template from the
# environment when the container starts and writes the result to conf.d/.
# Only variables that exist in the environment are replaced, so nginx's own
# variables ($uri, $proxy_add_x_forwarded_for) are left alone.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Defaults for docker compose. On Cloud Run, PORT is set by the platform and
# BACKEND_URL is set at deploy time to the backend's https://...run.app URL.
ENV PORT=8080
ENV BACKEND_URL=http://backend:8000

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
