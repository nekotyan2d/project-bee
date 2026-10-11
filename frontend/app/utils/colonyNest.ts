import type { LocalEvent } from "~/shared/db";

export function nestLabel(eventsNewestFirst: LocalEvent[], hiveCapacity?: number | null): string {
    for (const e of eventsNewestFirst) {
        if (e.type === "inspection" && typeof e.payload.framesTotal === "number") {
            const frames = String(e.payload.framesTotal);
            return hiveCapacity ? `${frames} / ${String(hiveCapacity)}` : frames;
        }
    }
    return "—";
}
