import type { LocalColony } from "~/shared/db";

export function needsHive(
    colony: Pick<LocalColony, "currentHiveId" | "status">,
    liveHiveIds: ReadonlySet<string>,
): boolean {
    if (colony.status !== "active") return false;
    return !colony.currentHiveId || !liveHiveIds.has(colony.currentHiveId);
}
