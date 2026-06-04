# ---------- build stage: produce /dist ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# devDeps (esbuild, html-minifier-terser) are needed to build; the optional
# image-generation deps (sharp, png-to-ico) are not — assets are pre-generated.
RUN npm ci --include=dev --omit=optional
COPY . .
# Railway passes service variables as build args; bake the canonical domain in.
ARG SITE_URL=https://routelogs.app
ENV SITE_URL=$SITE_URL
RUN node build.mjs

# ---------- serve stage: Caddy serving the static /dist ----------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
# caddy:2 image's default command runs /etc/caddy/Caddyfile and binds to $PORT.
