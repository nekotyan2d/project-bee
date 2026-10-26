import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { anonymousResponse, credentialsInput, meResponse, tokenResponse } from "./schema";
import * as service from "./service";

export const authRoutes: FastifyPluginAsyncZod = (app) => {
    app.post(
        "/auth/anonymous",
        {
            config: { rateLimit: { max: 10, timeWindow: "1 hour" } },
            schema: {
                tags: ["auth"],
                response: { 201: anonymousResponse },
            },
        },
        async (_request, reply) => {
            const userId = await service.createAnonymousUser();
            const token = app.jwt.sign({ sub: userId });
            return reply.status(201).send({ token });
        },
    );

    app.post(
        "/auth/register",
        {
            config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
            onRequest: app.authenticate,
            schema: {
                tags: ["auth"],
                body: credentialsInput,
                response: { 200: tokenResponse },
            },
        },
        async (request) => {
            await service.register(request.userId, request.body.email, request.body.password);
            const token = app.jwt.sign({ sub: request.userId });
            return { token, email: request.body.email };
        },
    );

    app.post(
        "/auth/login",
        {
            config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
            schema: {
                tags: ["auth"],
                body: credentialsInput,
                response: { 200: tokenResponse },
            },
        },
        async (request) => {
            const userId = await service.login(request.body.email, request.body.password);
            const token = app.jwt.sign({ sub: userId });
            return { token, email: request.body.email };
        },
    );

    app.get(
        "/auth/me",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["auth"],
                response: { 200: meResponse },
            },
        },
        (request) => service.getMe(request.userId),
    );

    return Promise.resolve();
};
