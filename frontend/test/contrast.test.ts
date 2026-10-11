import { expect, test } from "bun:test";

import { contrastRatio, readableTextColors, relativeLuminance } from "../app/utils/contrast";
import { HIVE_COLORS } from "../app/utils/hiveColors";

test("relativeLuminance: чёрный 0, белый 1, трёхзначный hex равен шестизначному", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#fff")).toBeCloseTo(relativeLuminance("#ffffff"), 10);
});

test("contrastRatio: чёрное на белом = 21, одинаковые цвета = 1", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#2563eb", "#2563eb")).toBeCloseTo(1, 10);
});

test("readableTextColors: на тёмном — белый, на светлом — чёрный", () => {
    expect(readableTextColors("#1e3a8a").text).toBe("#fff");
    expect(readableTextColors("#ffd500").text).toBe("#000");
    expect(readableTextColors("#ffd500").muted).toBe("rgba(0,0,0,0.75)");
    expect(readableTextColors("#000000").muted).toBe("rgba(255,255,255,0.75)");
});

test("readableTextColors: для палитры улья выбран тот цвет, у которого контраст не меньше", () => {
    for (const { hex } of HIVE_COLORS) {
        const { text } = readableTextColors(hex);
        const chosen = contrastRatio(hex, text);
        const other = contrastRatio(hex, text === "#fff" ? "#000" : "#fff");
        expect(chosen).toBeGreaterThanOrEqual(other);
    }
});
