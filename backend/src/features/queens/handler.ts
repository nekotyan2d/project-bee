import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { queenDto, queenInput, queenList, queenListQuery, queenParams } from "./schema";
import * as service from "./service";

export const queenRoutes: FastifyPluginAsyncZod = (app) => {
    app.get(
        "/queens",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["queen"],
                querystring: queenListQuery,
                response: { 200: queenList },
            },
        },
        (request) => service.listQueens(request.userId, request.query.since),
    );

    app.get(
        "/queens/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["queen"],
                params: queenParams,
                response: { 200: queenDto },
            },
        },
        (request) => service.getQueen(request.userId, request.params.id),
    );

    app.put(
        "/queens/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["queen"],
                params: queenParams,
                body: queenInput,
                response: { 200: queenDto },
            },
        },
        (request) => service.upsertQueen(request.userId, request.params.id, request.body),
    );

    app.delete(
        "/queens/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["queen"],
                params: queenParams,
                response: { 204: z.null() },
            },
        },
        async (request, reply) => {
            await service.deleteQueen(request.userId, request.params.id);
            return reply.status(204).send(null);
        },
    );

    return Promise.resolve();
};
