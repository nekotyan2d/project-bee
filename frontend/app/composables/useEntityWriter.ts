import { uuidv7 } from "uuidv7";

import type { LocalColony, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";
import type { ColonyFields, HiveFields, QueenFields } from "~/utils/entityForms";

export interface CreateColonyInput {
    apiaryId: string;
    colony: ColonyFields;
    hive: { existingId: string } | { fields: HiveFields };
    queen?: Pick<QueenFields, "year" | "breed">;
}

function introducedEvent(apiaryId: string, colonyId: string, queenId: string, now: Date): LocalEvent {
    return {
        id: uuidv7(),
        apiaryId,
        colonyId,
        type: "queen_change",
        occurredAt: now,
        payload: { action: "introduced", queenId },
        updatedAt: now,
    };
}

function migrationEvent(apiaryId: string, colonyId: string, toHiveId: string, now: Date): LocalEvent {
    return {
        id: uuidv7(),
        apiaryId,
        colonyId,
        type: "migration",
        occurredAt: now,
        payload: { toHiveId },
        updatedAt: now,
    };
}

export function useEntityWriter() {
    const db = useDb();
    const { enqueue } = useSync();

    async function createHive(apiaryId: string, fields: HiveFields): Promise<LocalHive> {
        const hive: LocalHive = { id: uuidv7(), apiaryId, ...fields, updatedAt: new Date() };
        await db.hive.add(hive);
        void enqueue("hive", hive.id, "upsert");
        return hive;
    }

    async function updateHive(id: string, fields: HiveFields): Promise<void> {
        await db.hive.update(id, { ...fields, updatedAt: new Date() });
        void enqueue("hive", id, "upsert");
    }

    async function moveHive(id: string, x: number, y: number): Promise<void> {
        await db.hive.update(id, { x, y, updatedAt: new Date() });
        void enqueue("hive", id, "upsert");
    }

    async function deleteHive(id: string): Promise<void> {
        const now = new Date();
        await db.hive.update(id, { deletedAt: now, updatedAt: now });
        void enqueue("hive", id, "delete");
    }

    async function createQueen(apiaryId: string, fields: QueenFields, colonyId?: string): Promise<LocalQueen> {
        const now = new Date();
        const queen: LocalQueen = { id: uuidv7(), colonyId, ...fields, updatedAt: now };
        const event = colonyId ? introducedEvent(apiaryId, colonyId, queen.id, now) : null;

        await db.transaction("rw", db.queen, db.colony, db.event, async () => {
            await db.queen.add(queen);
            if (event && colonyId) {
                await db.colony.update(colonyId, { currentQueenId: queen.id, updatedAt: now });
                await db.event.add(event);
            }
        });

        void enqueue("queen", queen.id, "upsert");
        if (event) void enqueue("event", event.id, "upsert");
        return queen;
    }

    async function updateQueen(id: string, fields: QueenFields): Promise<void> {
        await db.queen.update(id, { ...fields, updatedAt: new Date() });
        void enqueue("queen", id, "upsert");
    }

    async function deleteQueen(id: string): Promise<void> {
        const now = new Date();
        await db.queen.update(id, { deletedAt: now, updatedAt: now });
        void enqueue("queen", id, "delete");
    }

    async function updateColony(id: string, fields: ColonyFields): Promise<void> {
        await db.colony.update(id, { ...fields, updatedAt: new Date() });
        void enqueue("colony", id, "upsert");
    }

    async function createColony(input: CreateColonyInput): Promise<string> {
        const { apiaryId } = input;
        const now = new Date();

        let hive: LocalHive | null = null;
        let hiveId: string;
        if ("existingId" in input.hive) {
            hiveId = input.hive.existingId;
        } else {
            hive = { id: uuidv7(), apiaryId, ...input.hive.fields, updatedAt: now };
            hiveId = hive.id;
        }

        const queen: LocalQueen | null = input.queen
            ? { id: uuidv7(), colonyId: undefined, ...input.queen, status: "active", updatedAt: now }
            : null;

        const colony: LocalColony = {
            id: uuidv7(),
            apiaryId,
            ...input.colony,
            superCount: 0,
            currentHiveId: hiveId,
            currentQueenId: queen?.id,
            updatedAt: now,
        };
        if (queen) queen.colonyId = colony.id;

        const moved = migrationEvent(apiaryId, colony.id, hiveId, now);
        const introduced = queen ? introducedEvent(apiaryId, colony.id, queen.id, now) : null;

        await db.transaction("rw", db.hive, db.colony, db.queen, db.event, async () => {
            if (hive) await db.hive.add(hive);
            await db.colony.add(colony);
            await db.event.add(moved);
            if (queen) await db.queen.add(queen);
            if (introduced) await db.event.add(introduced);
        });

        if (hive) void enqueue("hive", hive.id, "upsert");
        void enqueue("colony", colony.id, "upsert");
        if (queen) void enqueue("queen", queen.id, "upsert");
        void enqueue("event", moved.id, "upsert");
        if (introduced) void enqueue("event", introduced.id, "upsert");

        return colony.id;
    }

    async function assignColonyToHive(colony: LocalColony, hiveId: string): Promise<void> {
        const now = new Date();
        const event = migrationEvent(colony.apiaryId, colony.id, hiveId, now);

        await db.transaction("rw", db.colony, db.event, async () => {
            await db.colony.update(colony.id, { currentHiveId: hiveId, updatedAt: now });
            await db.event.add(event);
        });

        void enqueue("event", event.id, "upsert");
    }

    return {
        createHive,
        updateHive,
        moveHive,
        deleteHive,
        createQueen,
        updateQueen,
        deleteQueen,
        updateColony,
        createColony,
        assignColonyToHive,
    };
}
