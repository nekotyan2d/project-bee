import cors from "@fastify/cors";
import Fastify from "fastify";
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { authPlugin } from "@/shared/http/auth";
import { registerErrorHandler } from "@/shared/http/error-handler";
import { swaggerPlugin } from "@/shared/http/swagger";

export async function createServer() {
    const app = Fastify({
        logger: { level: env.NODE_ENV === "production" ? "info" : "debug" },
    }).withTypeProvider<ZodTypeProvider>();

    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    registerErrorHandler(app);

    await app.register(cors, { origin: env.CORS_ORIGIN });
    await app.register(authPlugin);
    await app.register(swaggerPlugin);

    app.get(
        "/health",
        {
            schema: {
                tags: ["system"],
                response: { 200: z.object({ status: z.literal("ok") }) },
            },
        },
        () => ({ status: "ok" as const }),
    );

    return app;
}

export type AppServer = Awaited<ReturnType<typeof createServer>>;
