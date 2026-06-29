export const HIVE_COLORS = [
    { key: "red", hex: "#dc2626" },
    { key: "pink", hex: "#db2777" },
    { key: "violet", hex: "#9333ea" },
    { key: "blue", hex: "#2563eb" },
    { key: "sky", hex: "#0284c7" },
    { key: "lightblue", hex: "#4dd2ff" },
    { key: "teal", hex: "#0d9488" },
    { key: "green", hex: "#16a34a" },
    { key: "lime", hex: "#65a30d" },
    { key: "yellow", hex: "#ffd500" },
    { key: "orange", hex: "#ea580c" },
] as const;

export type HiveColor = (typeof HIVE_COLORS)[number]["key"];

export function hiveColorHex(key: string | undefined): string | undefined {
    return key ? HIVE_COLORS.find((c) => c.key === key)?.hex : undefined;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleaned = hex.replace("#", "");
    const full =
        cleaned.length === 3
            ? cleaned
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : cleaned;

    return {
        r: parseInt(full.substring(0, 2), 16),
        g: parseInt(full.substring(2, 4), 16),
        b: parseInt(full.substring(4, 6), 16),
    };
}
