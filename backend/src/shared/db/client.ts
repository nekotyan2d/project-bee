import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '@/shared/config/env';

import * as schema from './schema';

const queryClient = postgres({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
});

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;