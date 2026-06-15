import { z } from "zod";

export const colonyParams = z.object({
    id: z.uuid(),
});

export const colonyListQuery = z.object({
    apiaryId: z.uuid().optional(),
    since: z.iso.datetime({ offset: true }).optional(),
});

export const colonyInput = z.object({
    apiaryId: z.uuid(),
    label: z.string().min(1).max(200),
    establishedAt: z.iso.date().nullable().default(null),
    origin: z.string().max(500).nullable().default(null),
    status: z.string().min(1).max(50).default("active"),
});

export const colonyDto = z.object({
    id: z.uuid(),
    apiaryId: z.uuid(),
    currentHiveId: z.uuid().nullable(),
    label: z.string(),
    establishedAt: z.iso.date().nullable(),
    origin: z.string().nullable(),
    status: z.string(),
    currentQueenId: z.uuid().nullable(),
    superCount: z.number().int(),
    lastInspectedAt: z.iso.datetime({ offset: true }).nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
});

export const colonyList = z.array(colonyDto);

export type ColonyInput = z.infer<typeof colonyInput>;
export type ColonyDto = z.infer<typeof colonyDto>;
