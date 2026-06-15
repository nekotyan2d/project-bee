import fastifyJwt from "@fastify/jwt";
import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { env } from "@/shared/config/env";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: { sub: string };
        user: { sub: string };
    }
}

declare module "fastify" {
    interface FastifyRequest {
        userId: string;
    }
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

export const authPlugin = fp(async (app) => {
    await app.register(fastifyJwt, { secret: env.JWT_SECRET });

    app.decorateRequest("userId", "");

    app.decorate("authenticate", async (request: FastifyRequest) => {
        await request.jwtVerify();
        request.userId = request.user.sub;
    });
});
