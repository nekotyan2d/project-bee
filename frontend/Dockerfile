FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY . .
RUN bun install --frozen-lockfile

ENV NUXT_PUBLIC_API_BASE=/api
RUN bun run build

FROM nginx:1.31.2-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
