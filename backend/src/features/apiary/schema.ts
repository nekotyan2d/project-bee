import { z } from "zod";

export const apiaryParams = z.object({
    id: z.uuid(),
});

export const apiaryListQuery = z.object({
    since: z.iso.datetime({ offset: true }).optional(),
});

export const apiaryInput = z.object({
    name: z.string().min(1).max(200),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    notes: z.string().max(2000).nullable().default(null),
});

export const apiaryDto = z.object({
    id: z.uuid(),
    name: z.string(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    notes: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    deletedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const apiaryList = z.array(apiaryDto);

export type ApiaryInput = z.infer<typeof apiaryInput>;
export type ApiaryDto = z.infer<typeof apiaryDto>;
