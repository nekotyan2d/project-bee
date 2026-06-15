import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiaryDto, apiaryInput, apiaryList, apiaryListQuery, apiaryParams } from "./schema";
import * as service from "./service";

export const apiaryRoutes: FastifyPluginAsyncZod = (app) => {
    app.get(
        "/apiaries",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["apiary"],
                querystring: apiaryListQuery,
                response: { 200: apiaryList },
            },
        },
        (request) => service.listApiaries(request.userId, request.query.since),
    );

    app.get(
        "/apiaries/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["apiary"],
                params: apiaryParams,
                response: { 200: apiaryDto },
            },
        },
        (request) => service.getApiary(request.userId, request.params.id),
    );

    app.put(
        "/apiaries/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["apiary"],
                params: apiaryParams,
                body: apiaryInput,
                response: { 200: apiaryDto },
            },
        },
        (request) => service.upsertApiary(request.userId, request.params.id, request.body),
    );

    app.delete(
        "/apiaries/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["apiary"],
                params: apiaryParams,
                response: { 204: z.null() },
            },
        },
        async (request, reply) => {
            await service.deleteApiary(request.userId, request.params.id);
            return reply.status(204).send(null);
        },
    );

    return Promise.resolve();
};
