import type { OutboxItem, SyncTable } from "~/shared/db";

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

type Row = { id: string };
type SoftDeletable = Row & { deletedAt?: Date | null };

export function outboxItem(table: SyncTable, entityId: string, op: OutboxItem["op"], now = new Date()): OutboxItem {
    return { key: `${table}:${entityId}`, table, entityId, op, queuedAt: now };
}

export function pushAllItems(
    rows: {
        apiary: SoftDeletable[];
        hive: SoftDeletable[];
        colony: Row[];
        queen: SoftDeletable[];
        event: SoftDeletable[];
    },
    now = new Date(),
): OutboxItem[] {
    const items: OutboxItem[] = [];
    const add = (table: SyncTable, list: SoftDeletable[]): void => {
        for (const r of list) items.push(outboxItem(table, r.id, r.deletedAt ? "delete" : "upsert", now));
    };
    add("apiary", rows.apiary);
    add("hive", rows.hive);
    for (const c of rows.colony) items.push(outboxItem("colony", c.id, "upsert", now));
    add("queen", rows.queen);
    add("event", rows.event);
    return items;
}
