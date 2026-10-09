import { type EventType, getDb, type LocalColony, type LocalEvent } from "~/shared/db";

export async function loadEventsWithColonies(
    type: EventType,
): Promise<{ events: LocalEvent[]; colonies: Record<string, LocalColony> }> {
    const db = getDb();
    const events = await db.event
        .where("type")
        .equals(type)
        .filter((e) => !e.deletedAt)
        .toArray();

    const colonyIds = [...new Set(events.map((e) => e.colonyId).filter((id): id is string => !!id))];
    const colonies: Record<string, LocalColony> = {};
    for (const c of await db.colony.bulkGet(colonyIds)) {
        if (c) colonies[c.id] = c;
    }
    return { events, colonies };
}
