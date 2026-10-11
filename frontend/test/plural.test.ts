import { expect, test } from "bun:test";

import { pluralRu } from "../app/utils/plural";

const supers = (n: number) => pluralRu(n, "магазин", "магазина", "магазинов");

test("pluralRu: 1, 2–4 и 5+", () => {
    expect(supers(1)).toBe("магазин");
    expect(supers(2)).toBe("магазина");
    expect(supers(4)).toBe("магазина");
    expect(supers(5)).toBe("магазинов");
    expect(supers(0)).toBe("магазинов");
});

test("pluralRu: 11–14 всегда во множественном, 21 и 22 как 1 и 2", () => {
    expect(supers(11)).toBe("магазинов");
    expect(supers(12)).toBe("магазинов");
    expect(supers(14)).toBe("магазинов");
    expect(supers(21)).toBe("магазин");
    expect(supers(22)).toBe("магазина");
    expect(supers(111)).toBe("магазинов");
});
