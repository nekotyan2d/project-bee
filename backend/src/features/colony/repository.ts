import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/shared/db/client";
import { colony } from "@/shared/db/schema";
import { ownedApiaryIds } from "@/shared/db/scoping";

export { apiaryBelongsToOwner } from "@/shared/db/scoping";

export type ColonyRow = typeof colony.$inferSelect;

export interface UpsertColonyValues {
    id: string;
    apiaryId: string;
    label: string;
    establishedAt: string | null;
    origin: string | null;
    status: string;
}

export function findAll(ownerId: string, apiaryId?: string, since?: Date): Promise<ColonyRow[]> {
    const conditions = [inArray(colony.apiaryId, ownedApiaryIds(ownerId))];

    if (apiaryId) {
        conditions.push(eq(colony.apiaryId, apiaryId));
    }
    if (since) {
        conditions.push(gte(colony.updatedAt, since));
    }

    return db
        .select()
        .from(colony)
        .where(and(...conditions))
        .orderBy(desc(colony.updatedAt));
}

export async function findById(ownerId: string, id: string): Promise<ColonyRow | undefined> {
    const [row] = await db
        .select()
        .from(colony)
        .where(and(eq(colony.id, id), inArray(colony.apiaryId, ownedApiaryIds(ownerId))))
        .limit(1);

    return row;
}

export async function upsert(ownerId: string, values: UpsertColonyValues): Promise<ColonyRow | undefined> {
    const { id, ...fields } = values;

    const [row] = await db
        .insert(colony)
        .values({ id, ...fields })
        .onConflictDoUpdate({
            target: colony.id,
            set: { ...fields, updatedAt: sql`now()` },
            setWhere: inArray(colony.apiaryId, ownedApiaryIds(ownerId)),
        })
        .returning();

    return row;
}
