import type { LocalColony, LocalEvent } from "~/shared/db";

export type FeedingRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    feedType: string;
    amountKg: number | null;
    concentration: string;
};

export function buildFeedingRows(events: LocalEvent[], colonies: Record<string, LocalColony>): FeedingRow[] {
    return events
        .map((e) => ({
            event: e,
            colony: e.colonyId ? colonies[e.colonyId] : undefined,
            feedType: typeof e.payload.feedType === "string" ? e.payload.feedType : "—",
            amountKg: typeof e.payload.amountKg === "number" ? e.payload.amountKg : null,
            concentration: typeof e.payload.concentration === "string" ? e.payload.concentration : "",
        }))
        .sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());
}
