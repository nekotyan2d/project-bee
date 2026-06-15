import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export const swaggerPlugin = fp(async (app) => {
    await app.register(fastifySwagger, {
        openapi: {
            info: {
                title: "Beekeeping API",
                description: "API платформы для ведения пасеки",
                version: "0.1.0",
            },
        },
        transform: jsonSchemaTransform,
    });

    await app.register(fastifySwaggerUi, {
        routePrefix: "/docs",
    });
});
