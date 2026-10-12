# Пасека

Учёт пасеки: ульи, семьи, матки, журнал событий и аналитика по ним.
Офлайн-first PWA с API на сервере.

## Возможности

- Журнал событий семьи: осмотр, магазины, обработка, подкормка, откачка, смена матки, рой, переезд, деление,
  объединение, гибель, заметка, финансы.
- Состояние семьи (улей, матка, число магазинов, последний осмотр) выводится из событий.
- Схема ульев с перетаскиванием и список.
- Аналитика: откачки по сезонам, обработки и сроки ожидания, подкормки, выживаемость, финансы.
- Работает без сети: данные хранятся на устройстве (IndexedDB), на сервер уходят после регистрации.

## Состав

| Папка       | Что внутри                                        |
| ----------- | ------------------------------------------------- |
| `backend/`  | API: Bun, Fastify, Drizzle ORM, PostgreSQL, Zod 4 |
| `frontend/` | Nuxt 4 (SPA, PWA), Dexie, Konva                   |
| `docs/`     | архитектура фронтенда и ADR                       |

## Локальный запуск

Нужны Bun и PostgreSQL 17.

```bash
# база (подходит под backend/.env.example)
docker run -d --name bee-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bee -p 5432:5432 postgres:17-alpine

# бэкенд: http://localhost:8000, документация API — /docs
cd backend
cp .env.example .env
bun install
bun run db:migrate
bun run dev

# фронтенд: http://localhost:3000
cd frontend
bun install
bun run dev
```

Переменные бэкенда — `backend/.env.example`; `JWT_SECRET` не короче 32 символов.
Адрес API во фронтенде по умолчанию `http://localhost:8000` (`NUXT_PUBLIC_API_BASE`).

## Проверки

```bash
# backend
bun run lint
bun run typecheck
bun test

# frontend
bun run lint
bun run typecheck
bun run test
bun run build
```

После изменения API: `bun run gen:api` во `frontend/` (бэкенд должен быть запущен) обновляет типы клиента.

## Деплой

- `.github/workflows/build.yml` собирает образы `frontend` и `backend` на push в `main` и теги `v*`,
  публикует в `ghcr.io`; на `main` вызывает вебхуки Portainer.
- `docker-compose.yml` — база, бэкенд и фронтенд (nginx проксирует `/api/` на бэкенд); порт задаёт `HTTP_PORT`.
- `stack.yml` — тот же набор для Docker Swarm с Traefik.
- Переменные для обоих — `.env.example` в корне: `POSTGRES_*`, `JWT_SECRET`, `CORS_ORIGIN`, `GH_REPO`, `IMAGE_TAG`,
  `HTTP_PORT`.
- Контейнер бэкенда применяет миграции при старте.

## Документация

- [Архитектура фронтенда](docs/frontend-architecture.md)
- [Архитектурные решения (ADR)](docs/adr/README.md)
