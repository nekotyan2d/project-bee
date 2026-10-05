import { expect, test } from "bun:test";

import { suggestions } from "../app/utils/suggestions";

const ev = (day: number, payload: Record<string, unknown>) => ({ occurredAt: new Date(2026, 5, day), payload });

test("частые значения выше, поля берутся из последней записи", () => {
    const res = suggestions(
        [
            ev(1, { product: "Апитрит", dose: "1 мл" }),
            ev(3, { product: "Бипин", dose: "0.5 мл", withdrawalDays: 14 }),
            ev(5, { product: "Бипин", dose: "1 мл", method: "пары", withdrawalDays: 10 }),
            ev(6, {}),
        ],
        "product",
        ["dose", "method", "withdrawalDays"],
    );
    expect(res.map((s) => s.value)).toEqual(["Бипин", "Апитрит"]);
    expect(res[0]?.fill).toEqual({ dose: "1 мл", method: "пары", withdrawalDays: "10" });
});
