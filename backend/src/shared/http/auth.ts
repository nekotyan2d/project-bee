import fastifyJwt from "@fastify/jwt";
import { eq } from "drizzle-orm";
import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { env } from "@/shared/config/env";
import { db } from "@/shared/db/client";
import { users } from "@/shared/db/schema";
import { UnauthorizedError } from "@/shared/errors";

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
        const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, request.user.sub)).limit(1);
        if (!user) throw new UnauthorizedError("User not found");

        request.userId = user.id;
    });
});
