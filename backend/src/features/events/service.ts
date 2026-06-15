import { NotFoundError, ValidationError } from "@/shared/errors";

import * as repository from "./repository";
import type { ColonyDenormalizedPatch, EventRow, NewEvent } from "./repository";
import type { EventDto, EventInput } from "./schema";

function toDto(row: EventRow): EventDto {
    return {
        id: row.id,
        apiaryId: row.apiaryId,
        colonyId: row.colonyId,
        type: row.type,
        occurredAt: row.occurredAt.toISOString(),
        payload: row.payload as Record<string, unknown>,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        deletedAt: row.deletedAt?.toISOString() ?? null,
    };
}

function deriveColonyState(events: EventRow[]): ColonyDenormalizedPatch {
    let superCount = 0;
    let lastInspectedAt: Date | null = null;
    let currentHiveId: string | null = null;
    let latestMigrationAt: Date | null = null;
    let currentQueenId: string | null = null;
    let latestQueenChangeAt: Date | null = null;

    for (const e of events) {
        const payload = e.payload as Record<string, unknown>;

        if (e.type === "super_change") {
            if (typeof payload.delta === "number") {
                superCount += payload.delta;
            }
        } else if (e.type === "inspection") {
            if (!lastInspectedAt || e.occurredAt > lastInspectedAt) {
                lastInspectedAt = e.occurredAt;
            }
        } else if (e.type === "migration") {
            if ((!latestMigrationAt || e.occurredAt > latestMigrationAt) && typeof payload.toHiveId === "string") {
                latestMigrationAt = e.occurredAt;
                currentHiveId = payload.toHiveId;
            }
        } else if (e.type === "queen_change") {
            if (!latestQueenChangeAt || e.occurredAt > latestQueenChangeAt) {
                latestQueenChangeAt = e.occurredAt;
                currentQueenId =
                    payload.action === "lost" || payload.action === "died" || typeof payload.queenId !== "string"
                        ? null
                        : payload.queenId;
            }
        }
    }

    return { superCount, lastInspectedAt, currentHiveId, currentQueenId };
}

async function assertOwnership(ownerId: string, events: EventInput[]): Promise<void> {
    const apiaryIds = [...new Set(events.map((e) => e.apiaryId))];
    const colonyIds = [...new Set(events.flatMap((e) => (e.colonyId ? [e.colonyId] : [])))];
    const toHiveIds: string[] = [];
    const queenIds: string[] = [];
    for (const e of events) {
        if (e.type === "migration") {
            toHiveIds.push(e.payload.toHiveId);
        } else if (e.type === "queen_change" && e.payload.queenId) {
            queenIds.push(e.payload.queenId);
        }
    }

    const [ownedApiaries, ownedColonies, ownedHives, ownedQueens] = await Promise.all([
        repository.findOwnedApiaryIds(ownerId, apiaryIds),
        repository.findOwnedColonyIds(ownerId, colonyIds),
        repository.findOwnedHiveIds(ownerId, [...new Set(toHiveIds)]),
        repository.findOwnedQueenIds(ownerId, [...new Set(queenIds)]),
    ]);

    for (const id of apiaryIds) {
        if (!ownedApiaries.has(id)) {
            throw new ValidationError(`Unknown apiary ${id}`);
        }
    }
    for (const id of colonyIds) {
        if (!ownedColonies.has(id)) {
            throw new ValidationError(`Unknown colony ${id}`);
        }
    }
    for (const id of toHiveIds) {
        if (!ownedHives.has(id)) {
            throw new ValidationError(`Unknown hive ${id}`);
        }
    }
    for (const id of queenIds) {
        if (!ownedQueens.has(id)) {
            throw new ValidationError(`Unknown queen ${id}`);
        }
    }
}

export async function applyBatch(ownerId: string, events: EventInput[]): Promise<EventDto[]> {
    await assertOwnership(ownerId, events);

    const values: NewEvent[] = events.map((e) => ({
        id: e.id,
        apiaryId: e.apiaryId,
        colonyId: e.colonyId,
        type: e.type,
        occurredAt: new Date(e.occurredAt),
        payload: e.payload,
    }));

    const affectedColonies = new Set<string>();
    for (const e of events) {
        if (e.colonyId) {
            affectedColonies.add(e.colonyId);
        }
    }

    const stored = await repository.runInTransaction(async (tx) => {
        const rows = await repository.upsertMany(tx, values);
        for (const colonyId of affectedColonies) {
            const colonyEvents = await repository.findColonyEvents(tx, colonyId);
            await repository.updateColonyDenormalized(tx, colonyId, deriveColonyState(colonyEvents));
        }
        return rows;
    });

    return stored.map(toDto);
}

export async function listEvents(ownerId: string, since?: string): Promise<EventDto[]> {
    const rows = await repository.findAllForOwner(ownerId, since ? new Date(since) : undefined);
    return rows.map(toDto);
}

export async function deleteEvent(ownerId: string, id: string): Promise<void> {
    await repository.runInTransaction(async (tx) => {
        const row = await repository.softDelete(tx, ownerId, id);
        if (!row) {
            throw new NotFoundError(`Event ${id} not found`);
        }
        if (row.colonyId) {
            const colonyEvents = await repository.findColonyEvents(tx, row.colonyId);
            await repository.updateColonyDenormalized(tx, row.colonyId, deriveColonyState(colonyEvents));
        }
    });
}

export async function getTimeline(ownerId: string, colonyId: string, since?: string): Promise<EventDto[]> {
    const owns = await repository.colonyBelongsToOwner(ownerId, colonyId);
    if (!owns) {
        throw new NotFoundError(`Colony ${colonyId} not found`);
    }

    const rows = await repository.findTimeline(colonyId, since ? new Date(since) : undefined);
    return rows.map(toDto);
}
