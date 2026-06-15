import { z } from "zod";

export const queenParams = z.object({
    id: z.uuid(),
});

export const queenListQuery = z.object({
    since: z.iso.datetime({ offset: true }).optional(),
});

export const queenInput = z.object({
    colonyId: z.uuid().nullable().default(null),
    introducedAt: z.iso.date().nullable().default(null),
    year: z.number().int().min(1990).max(2100).nullable().default(null),
    breed: z.string().max(100).nullable().default(null),
    origin: z.string().max(500).nullable().default(null),
    motherQueenId: z.uuid().nullable().default(null),
    status: z.string().min(1).max(50).default("active"),
});

export const queenDto = z.object({
    id: z.uuid(),
    colonyId: z.uuid().nullable(),
    introducedAt: z.iso.date().nullable(),
    year: z.number().int().nullable(),
    breed: z.string().nullable(),
    origin: z.string().nullable(),
    motherQueenId: z.uuid().nullable(),
    status: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    deletedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const queenList = z.array(queenDto);

export type QueenInput = z.infer<typeof queenInput>;
export type QueenDto = z.infer<typeof queenDto>;
