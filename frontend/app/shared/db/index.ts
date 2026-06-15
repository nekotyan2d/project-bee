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
    latitude?: number;
    longitude?: number;
    notes?: string;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface LocalHive {
    id: string;
    apiaryId: string;
    label: string;
    type?: string;
    frameCount?: number;
    status: string;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface LocalColony {
    id: string;
    apiaryId: string;
    currentHiveId?: string;
    label: string;
    establishedAt?: string;
    origin?: string;
    status: string;
    currentQueenId?: string;
    superCount: number;
    lastInspectedAt?: Date;
    updatedAt: Date;
}

export interface LocalQueen {
    id: string;
    colonyId?: string;
    introducedAt?: string;
    year?: number;
    breed?: string;
    origin?: string;
    motherQueenId?: string;
    status: string;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface LocalEvent {
    id: string;
    apiaryId: string;
    colonyId?: string;
    type: EventType;
    occurredAt: Date;
    payload: Record<string, unknown>;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface SyncMeta {
    entity: string;
    lastPulledAt: Date;
}

class BeeDb extends Dexie {
    apiary!: EntityTable<LocalApiary, "id">;
    hive!: EntityTable<LocalHive, "id">;
    colony!: EntityTable<LocalColony, "id">;
    queen!: EntityTable<LocalQueen, "id">;
    event!: EntityTable<LocalEvent, "id">;
    syncMeta!: EntityTable<SyncMeta, "entity">;

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
    }
}

let _db: BeeDb | null = null;

export function getDb(): BeeDb {
    if (!_db) _db = new BeeDb();
    return _db;
}
