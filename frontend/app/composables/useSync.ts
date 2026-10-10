import type { paths } from "~/shared/api/schema";
import type { LocalApiary, LocalColony, LocalEvent, LocalHive, LocalQueen, OutboxItem, SyncTable } from "~/shared/db";
import type { Dated, SendResult } from "~/utils/sync";

type BatchBody = paths["/events/batch"]["post"]["requestBody"]["content"]["application/json"];

let flushing = false;

const FLUSH_ORDER: SyncTable[] = ["apiary", "hive", "colony", "queen", "event"];

export function useSync() {
    const db = useDb();
    const { $api } = useNuxtApp();
    const { getToken } = useAuthToken();

    async function pull(): Promise<void> {
        await Promise.allSettled([pullApiaries(), pullHives(), pullColonies(), pullQueens(), pullEvents()]);
    }

    async function enqueue(table: SyncTable, entityId: string, op: "upsert" | "delete"): Promise<void> {
        if (!getToken()) return;
        await db.outbox.put({ key: `${table}:${entityId}`, table, entityId, op, queuedAt: new Date() });
        void flush();
    }

    async function sendUpsert(table: SyncTable, id: string): Promise<SendResult> {
        switch (table) {
            case "apiary": {
                const r = await db.apiary.get(id);
                if (!r) return "ok";
                const res = await $api.PUT("/apiaries/{id}", {
                    params: { path: { id } },
                    body: {
                        name: r.name,
                        latitude: r.latitude,
                        longitude: r.longitude,
                        notes: r.notes,
                    },
                });
                return res.response.ok ? "ok" : classifyStatus(res.response.status);
            }
            case "hive": {
                const r = await db.hive.get(id);
                if (!r) return "ok";
                const res = await $api.PUT("/hives/{id}", {
                    params: { path: { id } },
                    body: {
                        apiaryId: r.apiaryId,
                        label: r.label,
                        type: r.type,
                        frameCount: r.frameCount,
                        status: r.status,
                        x: r.x,
                        y: r.y,
                        color: r.color,
                    },
                });
                return res.response.ok ? "ok" : classifyStatus(res.response.status);
            }
            case "colony": {
                const r = await db.colony.get(id);
                if (!r) return "ok";
                const res = await $api.PUT("/colonies/{id}", {
                    params: { path: { id } },
                    body: {
                        apiaryId: r.apiaryId,
                        label: r.label,
                        establishedAt: r.establishedAt,
                        origin: r.origin,
                        status: r.status,
                    },
                });
                return res.response.ok ? "ok" : classifyStatus(res.response.status);
            }
            case "queen": {
                const r = await db.queen.get(id);
                if (!r) return "ok";
                const res = await $api.PUT("/queens/{id}", {
                    params: { path: { id } },
                    body: {
                        colonyId: r.colonyId,
                        motherQueenId: r.motherQueenId,
                        year: r.year,
                        breed: r.breed,
                        origin: r.origin,
                        introducedAt: r.introducedAt,
                        status: r.status,
                    },
                });
                return res.response.ok ? "ok" : classifyStatus(res.response.status);
            }
            case "event": {
                const r = await db.event.get(id);
                if (!r) return "ok";

                const body = {
                    events: [
                        {
                            id: r.id,
                            apiaryId: r.apiaryId,
                            colonyId: r.colonyId,
                            occurredAt: r.occurredAt.toISOString(),
                            type: r.type,
                            payload: r.payload,
                        },
                    ],
                } as unknown as BatchBody;
                const res = await $api.POST("/events/batch", { body });
                return res.response.ok ? "ok" : classifyStatus(res.response.status);
            }
        }
    }

    async function sendDelete(table: SyncTable, id: string): Promise<SendResult> {
        let res;
        switch (table) {
            case "apiary":
                res = await $api.DELETE("/apiaries/{id}", { params: { path: { id } } });
                break;
            case "hive":
                res = await $api.DELETE("/hives/{id}", { params: { path: { id } } });
                break;
            case "queen":
                res = await $api.DELETE("/queens/{id}", { params: { path: { id } } });
                break;
            case "event":
                res = await $api.DELETE("/events/{id}", { params: { path: { id } } });
                break;
            default:
                return "ok";
        }
        if (res.response.ok || res.response.status === 404) return "ok";
        return classifyStatus(res.response.status);
    }

    async function send(item: OutboxItem): Promise<SendResult> {
        try {
            return item.op === "delete"
                ? await sendDelete(item.table, item.entityId)
                : await sendUpsert(item.table, item.entityId);
        } catch {
            return "retry"; // сеть недоступна
        }
    }

    async function flush(): Promise<boolean> {
        if (flushing) return false;
        flushing = true;
        try {
            while ((await db.outbox.count()) > 0) {
                for (const table of FLUSH_ORDER) {
                    const items = await db.outbox.where("table").equals(table).sortBy("queuedAt");
                    for (const item of items) {
                        const result = await send(item);
                        if (result === "retry") return false;
                        await db.outbox.delete(item.key);
                    }
                }
            }
            return true;
        } finally {
            flushing = false;
        }
    }

    async function pushAll(): Promise<void> {
        const [apiaries, hives, colonies, queens, events] = await Promise.all([
            db.apiary.toArray(),
            db.hive.toArray(),
            db.colony.toArray(),
            db.queen.toArray(),
            db.event.toArray(),
        ]);

        const items: OutboxItem[] = [];
        const add = (table: SyncTable, id: string, op: "upsert" | "delete"): void => {
            items.push({ key: `${table}:${id}`, table, entityId: id, op, queuedAt: new Date() });
        };
        for (const a of apiaries) add("apiary", a.id, a.deletedAt ? "delete" : "upsert");
        for (const h of hives) add("hive", h.id, h.deletedAt ? "delete" : "upsert");
        for (const c of colonies) add("colony", c.id, "upsert");
        for (const q of queens) add("queen", q.id, q.deletedAt ? "delete" : "upsert");
        for (const e of events) add("event", e.id, e.deletedAt ? "delete" : "upsert");

        await db.outbox.bulkPut(items);
        if (!(await flush())) throw new Error("Не удалось отправить данные на сервер");
    }

    async function since(entity: string): Promise<{ query: { since?: string }; prev?: Date }> {
        const m = await db.syncMeta.get(entity);
        return { query: m ? { since: m.lastPulledAt.toISOString() } : {}, prev: m?.lastPulledAt };
    }

    async function commit(entity: string, rows: Dated[], prev?: Date): Promise<void> {
        const cur = maxCursor(rows, prev);
        if (cur) await db.syncMeta.put({ entity, lastPulledAt: cur });
    }

    async function pullApiaries(): Promise<void> {
        const { query, prev } = await since("apiary");
        const { data } = await $api.GET("/apiaries", { params: { query } });
        if (!data) return;

        const rows: LocalApiary[] = data.map((d) => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }));
        await db.apiary.bulkPut(rows);

        for (const d of data) {
            if (!d.deletedAt) continue;
            await db.hive.where("apiaryId").equals(d.id).delete();
            await db.colony.where("apiaryId").equals(d.id).delete();
            await db.event.where("apiaryId").equals(d.id).delete();
        }

        await commit("apiary", data, prev);
    }

    async function pullHives(): Promise<void> {
        const { query, prev } = await since("hive");
        const { data } = await $api.GET("/hives", { params: { query } });
        if (!data) return;

        const rows: LocalHive[] = data.map((d) => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }));
        await db.hive.bulkPut(rows);
        await commit("hive", data, prev);
    }

    async function pullColonies(): Promise<void> {
        const { query, prev } = await since("colony");
        const { data } = await $api.GET("/colonies", { params: { query } });
        if (!data) return;

        const rows: LocalColony[] = data.map((d) => ({ ...d, lastInspectedAt: toDateOrNull(d.lastInspectedAt), updatedAt: new Date(d.updatedAt) }));
        await db.colony.bulkPut(rows);
        await commit("colony", data, prev);
    }

    async function pullQueens(): Promise<void> {
        const { query, prev } = await since("queen");
        const { data } = await $api.GET("/queens", { params: { query } });
        if (!data) return;

        const rows: LocalQueen[] = data.map((d) => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }));
        await db.queen.bulkPut(rows);
        await commit("queen", data, prev);
    }

    async function pullEvents(): Promise<void> {
        const { query, prev } = await since("event");
        const { data } = await $api.GET("/events", { params: { query } });
        if (!data) return;

        const rows: LocalEvent[] = data.map((d) => ({ ...d, occurredAt: new Date(d.occurredAt), deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }));
        await db.event.bulkPut(rows);
        await commit("event", data, prev);
    }

    return { pull, pushAll, enqueue, flush };
}
