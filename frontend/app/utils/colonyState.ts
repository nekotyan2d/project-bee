import type { LocalEvent } from "~/shared/db";

export interface DerivedColonyState {
    superCount: number;
    lastInspectedAt: Date | undefined;
    currentHiveId: string | undefined;
    currentQueenId: string | undefined;
}

const QUEEN_SET_ACTIONS = new Set(["introduced", "replaced", "superseded"]);

export function deriveColonyState(events: LocalEvent[]): DerivedColonyState {
    let superCount = 0;
    let lastInspectedAt: Date | undefined;
    let latestMigration: LocalEvent | undefined;
    let latestQueenChange: LocalEvent | undefined;

    for (const e of events) {
        if (e.deletedAt) continue;
        switch (e.type) {
            case "super_change":
                superCount += typeof e.payload.delta === "number" ? e.payload.delta : 0;
                break;
            case "inspection":
                if (!lastInspectedAt || e.occurredAt > lastInspectedAt) lastInspectedAt = e.occurredAt;
                break;
            case "migration":
                if (!latestMigration || e.occurredAt > latestMigration.occurredAt) latestMigration = e;
                break;
            case "queen_change":
                if (!latestQueenChange || e.occurredAt > latestQueenChange.occurredAt) latestQueenChange = e;
                break;
        }
    }

    let currentQueenId: string | undefined;
    if (latestQueenChange) {
        const action = latestQueenChange.payload.action;
        if (typeof action === "string" && QUEEN_SET_ACTIONS.has(action)) {
            currentQueenId =
                typeof latestQueenChange.payload.queenId === "string" ? latestQueenChange.payload.queenId : undefined;
        }
    }

    const currentHiveId =
        latestMigration && typeof latestMigration.payload.toHiveId === "string"
            ? latestMigration.payload.toHiveId
            : undefined;

    return { superCount: Math.max(0, superCount), lastInspectedAt, currentHiveId, currentQueenId };
}
