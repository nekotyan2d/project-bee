import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { anonymousResponse } from "./schema";
import * as service from "./service";

export const authRoutes: FastifyPluginAsyncZod = (app) => {
    app.post(
        "/auth/anonymous",
        {
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

    return Promise.resolve();
};
