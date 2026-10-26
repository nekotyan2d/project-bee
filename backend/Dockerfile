FROM oven/bun:1-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

USER bun

CMD ["sh", "-c", "bun run db:migrate && bun run src/app.ts"]
