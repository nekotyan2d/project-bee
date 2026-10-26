import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { db } from "@/shared/db/client";
import { apiary } from "@/shared/db/schema";

export type ApiaryRow = typeof apiary.$inferSelect;

export interface UpsertApiaryValues {
    id: string;
    ownerId: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    notes: string | null;
}

export function findAll(ownerId: string, since?: Date): Promise<ApiaryRow[]> {
    const ownedBy = eq(apiary.ownerId, ownerId);

    return db
        .select()
        .from(apiary)
        .where(since ? and(ownedBy, gte(apiary.updatedAt, since)) : and(ownedBy, isNull(apiary.deletedAt)))
        .orderBy(desc(apiary.updatedAt));
}

export async function findById(ownerId: string, id: string): Promise<ApiaryRow | undefined> {
    const [row] = await db
        .select()
        .from(apiary)
        .where(and(eq(apiary.ownerId, ownerId), eq(apiary.id, id), isNull(apiary.deletedAt)))
        .limit(1);

    return row;
}

export async function upsert(values: UpsertApiaryValues): Promise<ApiaryRow | undefined> {
    const { id, ownerId, ...fields } = values;

    const [row] = await db
        .insert(apiary)
        .values({ id, ownerId, ...fields })
        .onConflictDoUpdate({
            target: apiary.id,
            set: { ...fields, deletedAt: null, updatedAt: sql`now()` },
            setWhere: eq(apiary.ownerId, ownerId),
        })
        .returning();

    return row;
}

export async function softDelete(ownerId: string, id: string): Promise<boolean> {
    const deleted = await db
        .update(apiary)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(apiary.ownerId, ownerId), eq(apiary.id, id), isNull(apiary.deletedAt)))
        .returning({ id: apiary.id });

    return deleted.length > 0;
}
