# ---------- build stage: produce /dist ----------
# Base images pinned to digests (supply-chain integrity); bump via Dependabot.
FROM node:26-alpine@sha256:144769ec3f32e8ee36b3cfde91e82bee25d9367b20f31a151f3f7eea3a2a8541 AS build
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
FROM caddy:2-alpine@sha256:77c07d5ebfa5be9fd6c820d2094ae662c9e7eeb9bf98346b7f639900263ee2a2
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
