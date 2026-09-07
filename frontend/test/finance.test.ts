import { expect, test } from "bun:test";

import type { LocalEvent } from "../app/shared/db";

import { summarizeFinance } from "../app/utils/finance";

function ev(date: string, payload: Record<string, unknown>): LocalEvent {
    return {
        id: date,
        apiaryId: "a",
        type: "finance",
        occurredAt: new Date(date),
        payload,
        updatedAt: new Date(date),
    };
}

test("summarizeFinance: итоги и разбивка по категориям внутри сезона", () => {
    const seasons = summarizeFinance([
        ev("2025-06-01T00:00:00Z", { direction: "income", amount: 10000, category: "honey" }),
        ev("2025-07-01T00:00:00Z", { direction: "income", amount: 5000, category: "honey" }),
        ev("2025-03-01T00:00:00Z", { direction: "expense", amount: 2000, category: "feed" }),
        ev("2024-05-01T00:00:00Z", { direction: "expense", amount: 700, category: "equipment" }),
    ]);

    expect(seasons.map((s) => s.year)).toEqual([2025, 2024]);

    const y2025 = seasons[0]!;
    expect(y2025.income).toBe(15000);
    expect(y2025.expense).toBe(2000);
    expect(y2025.byCategory).toEqual([
        { category: "honey", income: true, sum: 15000 },
        { category: "feed", income: false, sum: 2000 },
    ]);
    // операции - новые первыми
    expect(y2025.rows.map((r) => r.event.id)).toEqual([
        "2025-07-01T00:00:00Z",
        "2025-06-01T00:00:00Z",
        "2025-03-01T00:00:00Z",
    ]);
});

test("summarizeFinance: битый payload не роняет подсчёт", () => {
    const [season] = summarizeFinance([ev("2025-01-01T00:00:00Z", {})]);

    expect(season?.expense).toBe(0);
    expect(season?.rows[0]?.category).toBe("other");
});

test("summarizeFinance: операции сезона режутся на месяцы, новые первыми", () => {
    const [season] = summarizeFinance([
        ev("2025-06-02T00:00:00Z", { direction: "expense", amount: 100, category: "feed" }),
        ev("2025-07-10T00:00:00Z", { direction: "income", amount: 900, category: "honey" }),
        ev("2025-06-20T00:00:00Z", { direction: "income", amount: 300, category: "honey" }),
    ]);

    expect(season?.months.map((m) => m.rows.length)).toEqual([1, 2]);
    expect(season?.months.map((m) => m.label)).toEqual(["Июль 2025 г.", "Июнь 2025 г."]);
    expect(season?.months[1]?.rows.map((r) => r.amount)).toEqual([300, 100]);
});
