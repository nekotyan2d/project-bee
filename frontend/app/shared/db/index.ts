import Dexie, { type EntityTable } from "dexie";

export type EventType =
    | "inspection"
    | "super_change"
    | "treatment"
    | "feeding"
    | "queen_change"
    | "harvest"
    | "swarm"
    | "migration"
    | "split"
    | "merge"
    | "death"
    | "note";

export interface LocalApiary {
    id: string;
    name: string;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface LocalHive {
    id: string;
    apiaryId: string;
    label: string;
    type?: string | null;
    frameCount?: number | null;
    status: string;
    x?: number | null;
    y?: number | null;
    color?: string | null;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface LocalColony {
    id: string;
    apiaryId: string;
    currentHiveId?: string | null;
    label: string;
    establishedAt?: string | null;
    origin?: string | null;
    status: string;
    currentQueenId?: string | null;
    superCount: number;
    lastInspectedAt?: Date | null;
    updatedAt: Date;
}

export interface LocalQueen {
    id: string;
    colonyId?: string | null;
    introducedAt?: string | null;
    year?: number | null;
    breed?: string | null;
    origin?: string | null;
    motherQueenId?: string | null;
    status: string;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface LocalEvent {
    id: string;
    apiaryId: string;
    colonyId?: string | null;
    type: EventType;
    occurredAt: Date;
    payload: Record<string, unknown>;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface SyncMeta {
    entity: string;
    lastPulledAt: Date;
}

export type SyncTable = "apiary" | "hive" | "colony" | "queen" | "event";

export interface OutboxItem {
    key: string; // `${table}:${entityId}`
    table: SyncTable;
    entityId: string;
    op: "upsert" | "delete";
    queuedAt: Date;
}

class BeeDb extends Dexie {
    apiary!: EntityTable<LocalApiary, "id">;
    hive!: EntityTable<LocalHive, "id">;
    colony!: EntityTable<LocalColony, "id">;
    queen!: EntityTable<LocalQueen, "id">;
    event!: EntityTable<LocalEvent, "id">;
    syncMeta!: EntityTable<SyncMeta, "entity">;
    outbox!: EntityTable<OutboxItem, "key">;

    constructor() {
        super("bee");
        this.version(1).stores({
            apiary: "id, updatedAt, deletedAt",
            hive: "id, apiaryId, updatedAt, deletedAt",
            colony: "id, apiaryId, currentHiveId, updatedAt",
            queen: "id, colonyId, updatedAt, deletedAt",
            event: "id, apiaryId, colonyId, [colonyId+occurredAt], type, updatedAt, deletedAt",
            syncMeta: "entity",
        });
        this.version(2).stores({
            outbox: "key, table, queuedAt",
        });
    }
}

let _db: BeeDb | null = null;

export function getDb(): BeeDb {
    if (!_db) _db = new BeeDb();
    return _db;
}
