# Фронтенд платформы для ведения пасеки

Nuxt 4 (SPA) + PWA. Данные хранятся на устройстве (Dexie / IndexedDB), синхронизируются с бэкендом.

## Запуск

```bash
bun install
bun run dev          # http://localhost:3000, API по умолчанию http://localhost:8000
```

## Скрипты

| Команда                              | Что делает                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `bun run dev`                        | dev-сервер                                                                                    |
| `bun run build` / `bun run generate` | сборка                                                                                        |
| `bun run lint` / `bun run lint:fix`  | eslint                                                                                        |
| `bun run typecheck`                  | проверка типов (`nuxt typecheck`)                                                             |
| `bun run test`                       | тесты чистой логики (`bun test test/`)                                                        |
| `bun run gen:api`                    | перегенерировать `app/shared/api/schema.d.ts` из OpenAPI бэкенда (бэкенд должен быть запущен) |

## Документация

- [Архитектура фронтенда](../docs/frontend-architecture.md): карта папок и правила изменений.
- [Архитектурные решения (ADR)](../docs/adr/README.md): почему сделано так.
