import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/shared/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT ?? 5432),
        user: process.env.POSTGRES_USER ?? "bee",
        password: process.env.POSTGRES_PASSWORD ?? "",
        database: process.env.POSTGRES_DB ?? "bee",
        ssl: false,
    },
    casing: "snake_case",
    verbose: true,
    strict: true,
});
