import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { db, type Db } from "@/shared/db/client";
import { colony, event } from "@/shared/db/schema";
import { ownedApiaryIds } from "@/shared/db/scoping";

export {
    colonyBelongsToOwner,
    findOwnedApiaryIds,
    findOwnedColonyIds,
    findOwnedHiveIds,
    findOwnedQueenIds,
} from "@/shared/db/scoping";

export type EventRow = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export interface ColonyDenormalizedPatch {
    superCount: number;
    lastInspectedAt: Date | null;
    currentHiveId: string | null;
    currentQueenId: string | null;
}

export function runInTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return db.transaction(fn);
}

export function findAllForOwner(ownerId: string, since?: Date): Promise<EventRow[]> {
    const conditions = [inArray(event.apiaryId, ownedApiaryIds(ownerId))];
    if (since) {
        conditions.push(gte(event.updatedAt, since));
    } else {
        conditions.push(isNull(event.deletedAt));
    }

    return db
        .select()
        .from(event)
        .where(and(...conditions))
        .orderBy(desc(event.updatedAt));
}

export async function softDelete(tx: Tx, ownerId: string, id: string): Promise<EventRow | undefined> {
    const [row] = await tx
        .update(event)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(event.id, id), isNull(event.deletedAt), inArray(event.apiaryId, ownedApiaryIds(ownerId))))
        .returning();

    return row;
}

export function upsertMany(tx: Tx, ownerId: string, values: NewEvent[]): Promise<EventRow[]> {
    return tx
        .insert(event)
        .values(values)
        .onConflictDoUpdate({
            target: event.id,
            set: {
                apiaryId: sql`excluded.apiary_id`,
                colonyId: sql`excluded.colony_id`,
                type: sql`excluded.type`,
                occurredAt: sql`excluded.occurred_at`,
                payload: sql`excluded.payload`,
                deletedAt: null,
                updatedAt: sql`now()`,
            },
            setWhere: inArray(event.apiaryId, ownedApiaryIds(ownerId)),
        })
        .returning();
}

export function findColonyEvents(tx: Tx, colonyId: string): Promise<EventRow[]> {
    return tx
        .select()
        .from(event)
        .where(and(eq(event.colonyId, colonyId), isNull(event.deletedAt)));
}

export async function updateColonyDenormalized(
    tx: Tx,
    colonyId: string,
    patch: ColonyDenormalizedPatch,
): Promise<void> {
    await tx
        .update(colony)
        .set({ ...patch, updatedAt: sql`now()` })
        .where(eq(colony.id, colonyId));
}

export function findTimeline(colonyId: string, since?: Date): Promise<EventRow[]> {
    const conditions = [eq(event.colonyId, colonyId), isNull(event.deletedAt)];
    if (since) {
        conditions.push(gte(event.occurredAt, since));
    }

    return db
        .select()
        .from(event)
        .where(and(...conditions))
        .orderBy(desc(event.occurredAt));
}
