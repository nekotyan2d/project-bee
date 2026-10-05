export interface HistoryItem {
    occurredAt: Date;
    payload: Record<string, unknown>;
}

export interface Suggestion {
    value: string;
    fill: Record<string, string>;
}

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

export function suggestions(items: HistoryItem[], field: string, fillFields: string[] = []): Suggestion[] {
    const byValue = new Map<string, { count: number; last: HistoryItem }>();
    for (const it of items) {
        const value = str(it.payload[field]).trim();
        if (!value) continue;
        const cur = byValue.get(value);
        if (!cur) byValue.set(value, { count: 1, last: it });
        else {
            cur.count++;
            if (it.occurredAt > cur.last.occurredAt) cur.last = it;
        }
    }
    return [...byValue]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([value, { last }]) => ({
            value,
            fill: Object.fromEntries(fillFields.map((k) => [k, str(last.payload[k])])),
        }));
}
