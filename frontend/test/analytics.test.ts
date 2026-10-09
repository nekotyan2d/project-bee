import { expect, test } from "bun:test";

import type { LocalColony, LocalEvent } from "../app/shared/db";

import { buildHarvestSeasons } from "../app/utils/analytics/harvest";
import { buildSurvival } from "../app/utils/analytics/survival";
import { activeWithdrawals, buildTreatmentRows } from "../app/utils/analytics/treatment";

function ev(id: string, type: LocalEvent["type"], date: string, payload: Record<string, unknown>, colonyId?: string) {
    return {
        id,
        apiaryId: "a",
        colonyId,
        type,
        occurredAt: new Date(date),
        payload,
        updatedAt: new Date(date),
    } as LocalEvent;
}

function colony(id: string, label: string, status: string) {
    return { id, apiaryId: "a", label, status, updatedAt: new Date() } as LocalColony;
}

test("buildHarvestSeasons: группировка по годам и суммы по продуктам", () => {
    const seasons = buildHarvestSeasons(
        [
            ev("1", "harvest", "2025-07-01T12:00:00", { amountKg: 10, framesCount: 4 }),
            ev("2", "harvest", "2025-08-01T12:00:00", { amountKg: 5.5, product: "wax" }),
            ev("3", "harvest", "2025-08-10T12:00:00", { amountKg: 2 }),
            ev("4", "harvest", "2024-07-01T12:00:00", { amountKg: 7 }),
        ],
        {},
    );

    expect(seasons.map((s) => s.year)).toEqual([2025, 2024]);
    expect(seasons[0]!.totalByProduct).toEqual({ honey: 12, wax: 5.5 });
    expect(seasons[0]!.framesByProduct).toEqual({ honey: 4 });
    expect(seasons[0]!.rows[0]!.event.id).toBe("3"); // новые сверху
});

test("buildTreatmentRows: daysLeft считается от переданной даты и не уходит в минус", () => {
    const now = new Date("2025-06-10T15:00:00");
    const rows = buildTreatmentRows(
        [
            ev("a", "treatment", "2025-06-08T09:00:00", { product: "X", withdrawalDays: 5 }),
            ev("b", "treatment", "2025-05-01T09:00:00", { product: "Y", withdrawalDays: 10 }),
            ev("c", "treatment", "2025-06-09T09:00:00", { product: "Z" }),
        ],
        {},
        now,
    );
    const byId = Object.fromEntries(rows.map((r) => [r.event.id, r.daysLeft]));

    expect(byId).toEqual({ a: 3, b: 0, c: null });
    expect(activeWithdrawals(rows).map((r) => r.event.id)).toEqual(["a"]);
});

test("buildSurvival: выживаемость по году гибели, без года — только в deadCount", () => {
    const data = buildSurvival(
        [
            colony("1", "A", "active"),
            colony("2", "B", "active"),
            colony("3", "C", "dead"),
            colony("4", "D", "dead"),
        ],
        [ev("e", "death", "2025-02-01T12:00:00", {}, "3")],
    );

    expect(data.activeCount).toBe(2);
    expect(data.deadCount).toBe(2);
    expect(data.years).toHaveLength(1);
    expect(data.years[0]).toMatchObject({ year: 2025, lost: 1, total: 3, rate: 67 });
});
