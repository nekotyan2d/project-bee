import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import { hiveDto, hiveInput, hiveList, hiveListQuery, hiveParams } from "./schema";
import * as service from "./service";

export const hiveRoutes: FastifyPluginAsyncZod = (app) => {
    app.get(
        "/hives",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["hive"],
                querystring: hiveListQuery,
                response: { 200: hiveList },
            },
        },
        (request) => service.listHives(request.userId, request.query.apiaryId, request.query.since),
    );

    app.get(
        "/hives/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["hive"],
                params: hiveParams,
                response: { 200: hiveDto },
            },
        },
        (request) => service.getHive(request.userId, request.params.id),
    );

    app.put(
        "/hives/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["hive"],
                params: hiveParams,
                body: hiveInput,
                response: { 200: hiveDto },
            },
        },
        (request) => service.upsertHive(request.userId, request.params.id, request.body),
    );

    app.delete(
        "/hives/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["hive"],
                params: hiveParams,
                response: { 204: z.null() },
            },
        },
        async (request, reply) => {
            await service.deleteHive(request.userId, request.params.id);
            return reply.status(204).send(null);
        },
    );

    return Promise.resolve();
};
