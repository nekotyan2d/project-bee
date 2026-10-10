export type SendResult = "ok" | "drop" | "retry";

export type Dated = { updatedAt: string; deletedAt?: string | null };

export function classifyStatus(status: number): SendResult {
    return status === 401 || status === 403 || status >= 500 ? "retry" : "drop";
}

export function toDateOrNull(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
}

export function maxCursor(rows: Dated[], prev?: Date): Date | undefined {
    let m = prev;
    for (const r of rows) {
        for (const ts of [r.updatedAt, r.deletedAt ?? undefined]) {
            if (!ts) continue;
            const d = new Date(ts);
            if (!m || d > m) m = d;
        }
    }
    return m;
}
