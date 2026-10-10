export function payloadNum(value: unknown): string | null {
    return typeof value === "number" ? String(value) : null;
}

export function payloadText(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

export function labelOf(dict: Record<string, string>, value: unknown): string | null {
    return typeof value === "string" ? (dict[value] ?? value) : null;
}
