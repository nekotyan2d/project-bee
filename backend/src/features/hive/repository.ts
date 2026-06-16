import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/shared/db/client";
import { hive } from "@/shared/db/schema";
import { ownedApiaryIds } from "@/shared/db/scoping";

export { apiaryBelongsToOwner } from "@/shared/db/scoping";

export type HiveRow = typeof hive.$inferSelect;

export interface UpsertHiveValues {
    id: string;
    apiaryId: string;
    label: string;
    type: string | null;
    frameCount: number | null;
    status: string;
    x: number | null;
    y: number | null;
    color: string | null;
}

export function findAll(ownerId: string, apiaryId?: string, since?: Date): Promise<HiveRow[]> {
    const conditions = [inArray(hive.apiaryId, ownedApiaryIds(ownerId))];

    if (apiaryId) {
        conditions.push(eq(hive.apiaryId, apiaryId));
    }
    if (since) {
        conditions.push(gte(hive.updatedAt, since));
    } else {
        conditions.push(isNull(hive.deletedAt));
    }

    return db
        .select()
        .from(hive)
        .where(and(...conditions))
        .orderBy(desc(hive.updatedAt));
}

export async function findById(ownerId: string, id: string): Promise<HiveRow | undefined> {
    const [row] = await db
        .select()
        .from(hive)
        .where(and(eq(hive.id, id), isNull(hive.deletedAt), inArray(hive.apiaryId, ownedApiaryIds(ownerId))))
        .limit(1);

    return row;
}

export async function upsert(values: UpsertHiveValues): Promise<HiveRow> {
    const { id, ...fields } = values;

    const [row] = await db
        .insert(hive)
        .values({ id, ...fields })
        .onConflictDoUpdate({
            target: hive.id,
            set: { ...fields, deletedAt: null, updatedAt: sql`now()` },
        })
        .returning();

    if (!row) {
        throw new Error("Upsert returned no row");
    }

    return row;
}

export async function softDelete(ownerId: string, id: string): Promise<boolean> {
    const deleted = await db
        .update(hive)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(hive.id, id), isNull(hive.deletedAt), inArray(hive.apiaryId, ownedApiaryIds(ownerId))))
        .returning({ id: hive.id });

    return deleted.length > 0;
}
