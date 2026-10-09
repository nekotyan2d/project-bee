import { expect, test } from "bun:test";

import type { LocalEvent } from "../app/shared/db";

import { deriveColonyState } from "../app/utils/colonyState";

let seq = 0;
function ev(type: LocalEvent["type"], date: string, payload: Record<string, unknown> = {}, deleted = false) {
    return {
        id: String(++seq),
        apiaryId: "a",
        colonyId: "c",
        type,
        occurredAt: new Date(date),
        payload,
        updatedAt: new Date(date),
        deletedAt: deleted ? new Date(date) : null,
    } as LocalEvent;
}

test("deriveColonyState: без событий — пустое состояние", () => {
    expect(deriveColonyState([])).toEqual({
        superCount: 0,
        lastInspectedAt: undefined,
        currentHiveId: undefined,
        currentQueenId: undefined,
    });
});

test("superCount: сумма delta по super_change, не уходит в минус", () => {
    const add = [ev("super_change", "2025-05-01", { delta: 2 }), ev("super_change", "2025-06-01", { delta: 1 })];
    expect(deriveColonyState(add).superCount).toBe(3);

    const overRemove = [...add, ev("super_change", "2025-07-01", { delta: -5 })];
    expect(deriveColonyState(overRemove).superCount).toBe(0);
});

test("lastInspectedAt: самая поздняя дата осмотра, порядок событий не важен", () => {
    const state = deriveColonyState([
        ev("inspection", "2025-06-10"),
        ev("inspection", "2025-07-01"),
        ev("inspection", "2025-05-01"),
    ]);
    expect(state.lastInspectedAt).toEqual(new Date("2025-07-01"));
});

test("currentHiveId: последняя по дате миграция", () => {
    const state = deriveColonyState([
        ev("migration", "2025-06-01", { toHiveId: "h2" }),
        ev("migration", "2025-05-01", { toHiveId: "h1" }),
    ]);
    expect(state.currentHiveId).toBe("h2");
});

test("currentQueenId: introduced/replaced/superseded ставят матку, lost/died сбрасывают", () => {
    const set = deriveColonyState([ev("queen_change", "2025-05-01", { action: "replaced", queenId: "q1" })]);
    expect(set.currentQueenId).toBe("q1");

    const lostAfter = deriveColonyState([
        ev("queen_change", "2025-05-01", { action: "introduced", queenId: "q1" }),
        ev("queen_change", "2025-06-01", { action: "lost" }),
    ]);
    expect(lostAfter.currentQueenId).toBeUndefined();

    const newerWins = deriveColonyState([
        ev("queen_change", "2025-06-01", { action: "replaced", queenId: "q2" }),
        ev("queen_change", "2025-05-01", { action: "died" }),
    ]);
    expect(newerWins.currentQueenId).toBe("q2");
});

test("удалённые события не учитываются: пересчёт после удаления откатывает состояние", () => {
    const state = deriveColonyState([
        ev("super_change", "2025-05-01", { delta: 2 }),
        ev("super_change", "2025-06-01", { delta: 3 }, true),
        ev("inspection", "2025-07-01", {}, true),
        ev("migration", "2025-07-01", { toHiveId: "h9" }, true),
    ]);

    expect(state.superCount).toBe(2);
    expect(state.lastInspectedAt).toBeUndefined();
    expect(state.currentHiveId).toBeUndefined();
});
