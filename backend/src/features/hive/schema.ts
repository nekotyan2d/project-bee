import { z } from "zod";

export const hiveParams = z.object({
    id: z.uuid(),
});

export const hiveListQuery = z.object({
    apiaryId: z.uuid().optional(),
    since: z.iso.datetime({ offset: true }).optional(),
});

export const hiveInput = z.object({
    apiaryId: z.uuid(),
    label: z.string().min(1).max(200),
    type: z.string().max(100).nullable().default(null),
    frameCount: z.number().int().positive().max(100).nullable().default(null),
    status: z.string().min(1).max(50).default("active"),
    x: z.number().int().nullable().default(null),
    y: z.number().int().nullable().default(null),
    color: z.string().max(50).nullable().default(null),
});

export const hiveDto = z.object({
    id: z.uuid(),
    apiaryId: z.uuid(),
    label: z.string(),
    type: z.string().nullable(),
    frameCount: z.number().int().nullable(),
    status: z.string(),
    x: z.number().int().nullable(),
    y: z.number().int().nullable(),
    color: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    deletedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const hiveList = z.array(hiveDto);

export type HiveInput = z.infer<typeof hiveInput>;
export type HiveDto = z.infer<typeof hiveDto>;
