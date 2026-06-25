# ---------- build stage: produce /dist ----------
# Base images pinned to digests (supply-chain integrity); bump via Dependabot.
FROM node:22-alpine@sha256:968df39aedcea65eeb078fb336ed7191baf48f972b4479711397108be0966920 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# devDeps (esbuild, html-minifier-terser) are needed to build; the optional
# image-generation deps (sharp, png-to-ico) are not — assets are pre-generated.
RUN npm ci --include=dev --omit=optional
COPY . .
# Railway passes service variables as build args; bake the canonical domain in.
ARG SITE_URL=https://routelogs.up.railway.app
ENV SITE_URL=$SITE_URL
RUN node build.mjs

# ---------- serve stage: Caddy serving the static /dist ----------
FROM caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
# Run as a non-root user with writable Caddy state dirs (defense in depth).
ENV XDG_DATA_HOME=/data XDG_CONFIG_HOME=/config
RUN addgroup -g 10001 app \
 && adduser -u 10001 -G app -S -H app \
 && mkdir -p /data /config \
 && chown -R app:app /data /config /srv
USER app
# caddy:2 default entrypoint runs /etc/caddy/Caddyfile and binds to $PORT.
