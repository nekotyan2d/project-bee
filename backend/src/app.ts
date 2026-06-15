import { apiaryRoutes } from "@/features/apiary/handler";
import { authRoutes } from "@/features/auth/handler";
import { colonyRoutes } from "@/features/colony/handler";
import { eventRoutes } from "@/features/events/handler";
import { hiveRoutes } from "@/features/hive/handler";
import { queenRoutes } from "@/features/queens/handler";
import { env } from "@/shared/config/env";
import { createServer } from "@/shared/http/server";

const app = await createServer();

await app.register(authRoutes);
await app.register(apiaryRoutes);
await app.register(hiveRoutes);
await app.register(colonyRoutes);
await app.register(eventRoutes);
await app.register(queenRoutes);

try {
    await app.listen({ host: env.HOST, port: env.PORT });
} catch (err) {
    app.log.error(err);
    process.exit(1);
}
