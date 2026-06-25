import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3000),
    // Параметры БД по отдельности, а не одним DATABASE_URL: пароль из base64
    // (`/`, `+`) ломает разбор URL в postgres.js (new URL → ERR_INVALID_URL).
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
    POSTGRES_USER: z.string().default('bee'),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string().default('bee'),
    JWT_SECRET: z.string().min(32),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:', z.treeifyError(parsed.error));
    process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
