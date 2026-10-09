import type { LocalColony, LocalEvent } from "~/shared/db";

export type TreatmentRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    product: string;
    dose: string;
    withdrawalDays: number | null;
    withdrawalEnd: Date | null;
    daysLeft: number | null;
};

const DAY_MS = 86400000;

export function buildTreatmentRows(
    events: LocalEvent[],
    colonies: Record<string, LocalColony>,
    now: Date = new Date(),
): TreatmentRow[] {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return events
        .map((e) => {
            const withdrawalDays = typeof e.payload.withdrawalDays === "number" ? e.payload.withdrawalDays : null;
            let withdrawalEnd: Date | null = null;
            let daysLeft: number | null = null;
            if (withdrawalDays !== null) {
                const end = new Date(e.occurredAt);
                end.setDate(end.getDate() + withdrawalDays);
                end.setHours(0, 0, 0, 0);
                withdrawalEnd = end;
                daysLeft = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / DAY_MS));
            }
            return {
                event: e,
                colony: e.colonyId ? colonies[e.colonyId] : undefined,
                product: typeof e.payload.product === "string" ? e.payload.product : "—",
                dose: typeof e.payload.dose === "string" ? e.payload.dose : "",
                withdrawalDays,
                withdrawalEnd,
                daysLeft,
            };
        })
        .sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());
}

export function activeWithdrawals(rows: TreatmentRow[]): TreatmentRow[] {
    return rows.filter((r) => r.daysLeft !== null && r.daysLeft > 0);
}
