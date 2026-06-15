import type { FastifyError, FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from "fastify-type-provider-zod";

import { AppError } from "@/shared/errors";

export function registerErrorHandler(app: FastifyInstance) {
    app.setErrorHandler((error: FastifyError, _request, reply) => {
        if (hasZodFastifySchemaValidationErrors(error)) {
            return reply.status(400).send({
                code: "VALIDATION_ERROR",
                message: "Request does not match schema",
                issues: error.validation,
            });
        }

        if (isResponseSerializationError(error)) {
            app.log.error(error);
            return reply.status(500).send({
                code: "RESPONSE_SERIALIZATION_ERROR",
                message: "Response does not match schema",
            });
        }

        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                code: error.code,
                message: error.message,
            });
        }

        if (typeof error.statusCode === "number" && error.statusCode < 500) {
            return reply.status(error.statusCode).send({
                code: error.code,
                message: error.message,
            });
        }

        app.log.error(error);
        return reply.status(500).send({
            code: "INTERNAL_ERROR",
            message: "Internal server error",
        });
    });
}
