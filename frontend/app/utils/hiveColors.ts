export const HIVE_COLORS = [
    { key: "red",    hex: "#dc2626" },
    { key: "rose",   hex: "#e11d48" },
    { key: "pink",   hex: "#db2777" },
    { key: "orange", hex: "#ea580c" },
    { key: "amber",  hex: "#d97706" },
    { key: "lime",   hex: "#65a30d" },
    { key: "green",  hex: "#16a34a" },
    { key: "teal",   hex: "#0d9488" },
    { key: "sky",    hex: "#0284c7" },
    { key: "blue",   hex: "#2563eb" },
    { key: "indigo", hex: "#4f46e5" },
    { key: "violet", hex: "#7c3aed" },
    { key: "purple", hex: "#9333ea" },
    { key: "slate",  hex: "#64748b" },
] as const;

export type HiveColor = (typeof HIVE_COLORS)[number]["key"];

export function hiveColorHex(key: string | undefined): string | undefined {
    return key ? HIVE_COLORS.find((c) => c.key === key)?.hex : undefined;
}
