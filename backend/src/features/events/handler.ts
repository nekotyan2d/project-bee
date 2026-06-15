import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

import {
    eventBatchInput,
    eventBatchResponse,
    eventList,
    eventListQuery,
    eventParams,
    timelineParams,
    timelineQuery,
} from "./schema";
import * as service from "./service";

export const eventRoutes: FastifyPluginAsyncZod = (app) => {
    app.post(
        "/events/batch",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["event"],
                body: eventBatchInput,
                response: { 200: eventBatchResponse },
            },
        },
        async (request) => {
            const events = await service.applyBatch(request.userId, request.body.events);
            return { events };
        },
    );

    app.get(
        "/events",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["event"],
                querystring: eventListQuery,
                response: { 200: eventList },
            },
        },
        (request) => service.listEvents(request.userId, request.query.since),
    );

    app.delete(
        "/events/:id",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["event"],
                params: eventParams,
                response: { 204: z.null() },
            },
        },
        async (request, reply) => {
            await service.deleteEvent(request.userId, request.params.id);
            return reply.status(204).send(null);
        },
    );

    app.get(
        "/colonies/:id/timeline",
        {
            onRequest: app.authenticate,
            schema: {
                tags: ["event"],
                params: timelineParams,
                querystring: timelineQuery,
                response: { 200: eventList },
            },
        },
        (request) => service.getTimeline(request.userId, request.params.id, request.query.since),
    );

    return Promise.resolve();
};
