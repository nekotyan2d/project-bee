import { z } from "zod";

import { EVENT_TYPES } from "@/shared/db/schema";

const colonyScoped = {
    id: z.uuid(),
    apiaryId: z.uuid(),
    colonyId: z.uuid(),
    occurredAt: z.iso.datetime({ offset: true }),
};

const apiaryScoped = {
    id: z.uuid(),
    apiaryId: z.uuid(),
    colonyId: z.uuid().nullable().default(null),
    occurredAt: z.iso.datetime({ offset: true }),
};

const inspectionPayload = z
    .object({
        framesTotal: z.number().int().min(0).max(50).optional(),
        framesBrood: z.number().int().min(0).max(50).optional(),
        framesStores: z.number().int().min(0).max(50).optional(),
        queenSeen: z.boolean().optional(),
        queenCells: z.number().int().min(0).optional(),
        temperament: z.enum(["calm", "nervous", "aggressive"]).optional(),
        storesLevel: z.enum(["low", "medium", "high"]).optional(),
        notes: z.string().max(2000).optional(),
    })
    .default({});

const superChangePayload = z.object({
    delta: z.number().int().min(-20).max(20).refine((v) => v !== 0, "delta must not be zero"),
    reason: z.string().max(500).optional(),
});

const treatmentPayload = z.object({
    product: z.string().min(1).max(200),
    dose: z.string().max(200).optional(),
    method: z.string().max(200).optional(),
    withdrawalDays: z.number().int().min(0).max(365).optional(),
    target: z.string().max(200).optional(),
});

const feedingPayload = z.object({
    feedType: z.enum(["syrup", "candy", "honey", "pollen_substitute", "water"]),
    amountKg: z.number().min(0).max(100).optional(),
    concentration: z.string().max(100).optional(),
});

const queenChangePayload = z.object({
    action: z.enum(["introduced", "replaced", "superseded", "lost", "died"]),
    queenId: z.uuid().optional(),
});

const harvestPayload = z.object({
    product: z.enum(["honey", "wax", "propolis", "pollen"]).default("honey"),
    amountKg: z.number().min(0).max(1000),
});

const swarmPayload = z.object({ captured: z.boolean().optional(), notes: z.string().max(2000).optional() }).default({});

const migrationPayload = z.object({ toHiveId: z.uuid(), fromHiveId: z.uuid().optional() });

const splitPayload = z.object({ intoColonyId: z.uuid().optional(), notes: z.string().max(2000).optional() }).default({});

const mergePayload = z.object({ intoColonyId: z.uuid().optional(), notes: z.string().max(2000).optional() }).default({});

const deathPayload = z.object({ cause: z.string().max(500).optional() }).default({});

const notePayload = z.object({ text: z.string().min(1).max(4000) });

export const eventInput = z.discriminatedUnion("type", [
    z.object({ ...colonyScoped, type: z.literal("inspection"), payload: inspectionPayload }),
    z.object({ ...colonyScoped, type: z.literal("super_change"), payload: superChangePayload }),
    z.object({ ...colonyScoped, type: z.literal("treatment"), payload: treatmentPayload }),
    z.object({ ...colonyScoped, type: z.literal("feeding"), payload: feedingPayload }),
    z.object({ ...colonyScoped, type: z.literal("queen_change"), payload: queenChangePayload }),
    z.object({ ...colonyScoped, type: z.literal("harvest"), payload: harvestPayload }),
    z.object({ ...colonyScoped, type: z.literal("swarm"), payload: swarmPayload }),
    z.object({ ...colonyScoped, type: z.literal("migration"), payload: migrationPayload }),
    z.object({ ...colonyScoped, type: z.literal("split"), payload: splitPayload }),
    z.object({ ...colonyScoped, type: z.literal("merge"), payload: mergePayload }),
    z.object({ ...colonyScoped, type: z.literal("death"), payload: deathPayload }),
    z.object({ ...apiaryScoped, type: z.literal("note"), payload: notePayload }),
]);

export const eventBatchInput = z.object({
    events: z.array(eventInput).min(1).max(500),
});

export const eventDto = z.object({
    id: z.uuid(),
    apiaryId: z.uuid(),
    colonyId: z.uuid().nullable(),
    type: z.enum(EVENT_TYPES),
    occurredAt: z.iso.datetime({ offset: true }),
    payload: z.record(z.string(), z.unknown()),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    deletedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const eventList = z.array(eventDto);

export const eventBatchResponse = z.object({ events: eventList });

export const eventParams = z.object({ id: z.uuid() });

export const eventListQuery = z.object({
    since: z.iso.datetime({ offset: true }).optional(),
});

export const timelineParams = z.object({ id: z.uuid() });

export const timelineQuery = z.object({
    since: z.iso.datetime({ offset: true }).optional(),
});

export type EventInput = z.infer<typeof eventInput>;
export type EventDto = z.infer<typeof eventDto>;
