import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "./client";
import { apiary, colony, hive, queen } from "./schema";

export function ownedApiaryIds(ownerId: string) {
    return db
        .select({ id: apiary.id })
        .from(apiary)
        .where(and(eq(apiary.ownerId, ownerId), isNull(apiary.deletedAt)));
}

export async function apiaryBelongsToOwner(ownerId: string, apiaryId: string): Promise<boolean> {
    const [row] = await db
        .select({ id: apiary.id })
        .from(apiary)
        .where(and(eq(apiary.id, apiaryId), eq(apiary.ownerId, ownerId), isNull(apiary.deletedAt)))
        .limit(1);

    return row !== undefined;
}

export async function hiveBelongsToOwner(ownerId: string, hiveId: string): Promise<boolean> {
    const [row] = await db
        .select({ id: hive.id })
        .from(hive)
        .where(and(eq(hive.id, hiveId), inArray(hive.apiaryId, ownedApiaryIds(ownerId)), isNull(hive.deletedAt)))
        .limit(1);

    return row !== undefined;
}

export async function colonyBelongsToOwner(ownerId: string, colonyId: string): Promise<boolean> {
    const [row] = await db
        .select({ id: colony.id })
        .from(colony)
        .where(and(eq(colony.id, colonyId), inArray(colony.apiaryId, ownedApiaryIds(ownerId))))
        .limit(1);

    return row !== undefined;
}

export async function queenBelongsToOwner(ownerId: string, queenId: string): Promise<boolean> {
    const [row] = await db
        .select({ id: queen.id })
        .from(queen)
        .where(and(eq(queen.id, queenId), eq(queen.ownerId, ownerId), isNull(queen.deletedAt)))
        .limit(1);

    return row !== undefined;
}

async function toIdSet(rows: Promise<{ id: string }[]>): Promise<Set<string>> {
    return new Set((await rows).map((r) => r.id));
}

export function findOwnedApiaryIds(ownerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
        return Promise.resolve(new Set());
    }
    return toIdSet(
        db
            .select({ id: apiary.id })
            .from(apiary)
            .where(and(eq(apiary.ownerId, ownerId), inArray(apiary.id, ids), isNull(apiary.deletedAt))),
    );
}

export function findOwnedColonyIds(ownerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
        return Promise.resolve(new Set());
    }
    return toIdSet(
        db
            .select({ id: colony.id })
            .from(colony)
            .where(and(inArray(colony.id, ids), inArray(colony.apiaryId, ownedApiaryIds(ownerId)))),
    );
}

export function findOwnedHiveIds(ownerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
        return Promise.resolve(new Set());
    }
    return toIdSet(
        db
            .select({ id: hive.id })
            .from(hive)
            .where(and(inArray(hive.id, ids), inArray(hive.apiaryId, ownedApiaryIds(ownerId)), isNull(hive.deletedAt))),
    );
}

export function findOwnedQueenIds(ownerId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) {
        return Promise.resolve(new Set());
    }
    return toIdSet(
        db
            .select({ id: queen.id })
            .from(queen)
            .where(and(eq(queen.ownerId, ownerId), inArray(queen.id, ids), isNull(queen.deletedAt))),
    );
}
