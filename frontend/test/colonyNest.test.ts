import { expect, test } from "bun:test";

import type { LocalEvent } from "../app/shared/db";

import { nestLabel } from "../app/utils/colonyNest";

const ev = (type: string, payload: Record<string, unknown> = {}) => ({ type, payload }) as unknown as LocalEvent;

test("nestLabel: берёт последний (первый в списке) осмотр с числом рамок", () => {
    const events = [
        ev("note"),
        ev("inspection", { notes: "без рамок" }),
        ev("inspection", { framesTotal: 10 }),
        ev("inspection", { framesTotal: 6 }),
    ];
    expect(nestLabel(events)).toBe("10");
});

test("nestLabel: вместимость улья добавляется через слэш", () => {
    expect(nestLabel([ev("inspection", { framesTotal: 8 })], 12)).toBe("8 / 12");
    expect(nestLabel([ev("inspection", { framesTotal: 8 })], null)).toBe("8");
});

test("nestLabel: без осмотров — прочерк", () => {
    expect(nestLabel([])).toBe("—");
    expect(nestLabel([ev("note")], 12)).toBe("—");
});
