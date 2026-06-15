import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { colonyDto, colonyInput, colonyList, colonyListQuery, colonyParams } from "./schema";
import * as service from "./service";

export const colonyRoutes: FastifyPluginAsyncZod = (app) => {
    app.get(
        "/colonies",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["colony"],
                querystring: colonyListQuery,
                response: { 200: colonyList },
            },
        },
        (request) => service.listColonies(request.userId, request.query.apiaryId, request.query.since),
    );

    app.get(
        "/colonies/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["colony"],
                params: colonyParams,
                response: { 200: colonyDto },
            },
        },
        (request) => service.getColony(request.userId, request.params.id),
    );

    app.put(
        "/colonies/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["colony"],
                params: colonyParams,
                body: colonyInput,
                response: { 200: colonyDto },
            },
        },
        (request) => service.upsertColony(request.userId, request.params.id, request.body),
    );

    return Promise.resolve();
};
