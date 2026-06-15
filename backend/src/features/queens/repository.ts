import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";

import { db } from "@/shared/db/client";
import { queen } from "@/shared/db/schema";

export { colonyBelongsToOwner, queenBelongsToOwner } from "@/shared/db/scoping";

export type QueenRow = typeof queen.$inferSelect;

export interface UpsertQueenValues {
    id: string;
    ownerId: string;
    colonyId: string | null;
    introducedAt: string | null;
    year: number | null;
    breed: string | null;
    origin: string | null;
    motherQueenId: string | null;
    status: string;
}

export function findAll(ownerId: string, since?: Date): Promise<QueenRow[]> {
    const ownedBy = eq(queen.ownerId, ownerId);

    return db
        .select()
        .from(queen)
        .where(since ? and(ownedBy, gte(queen.updatedAt, since)) : and(ownedBy, isNull(queen.deletedAt)))
        .orderBy(desc(queen.updatedAt));
}

export async function findById(ownerId: string, id: string): Promise<QueenRow | undefined> {
    const [row] = await db
        .select()
        .from(queen)
        .where(and(eq(queen.ownerId, ownerId), eq(queen.id, id), isNull(queen.deletedAt)))
        .limit(1);

    return row;
}

export async function upsert(values: UpsertQueenValues): Promise<QueenRow> {
    const { id, ownerId, ...fields } = values;

    const [row] = await db
        .insert(queen)
        .values({ id, ownerId, ...fields })
        .onConflictDoUpdate({
            target: queen.id,
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
        .update(queen)
        .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
        .where(and(eq(queen.ownerId, ownerId), eq(queen.id, id), isNull(queen.deletedAt)))
        .returning({ id: queen.id });

    return deleted.length > 0;
}
