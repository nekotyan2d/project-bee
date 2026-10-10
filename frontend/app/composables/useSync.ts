import type { paths } from "~/shared/api/schema";
import type { LocalApiary, LocalColony, LocalEvent, LocalHive, LocalQueen, OutboxItem, SyncTable } from "~/shared/db";
import type { Dated, SendResult } from "~/utils/sync";

type BatchBody = paths["/events/batch"]["post"]["requestBody"]["content"]["application/json"];

let flushing = false;

const FLUSH_ORDER: SyncTable[] = ["apiary", "hive", "colony", "queen", "event"];

type Sent = { response: Response };

export function useSync() {
    const db = useDb();
    const { $api } = useNuxtApp();
    const { getToken } = useAuthToken();

    async function pull(): Promise<void> {
        await Promise.allSettled(pullers.map((run) => run()));
    }

    async function enqueue(table: SyncTable, entityId: string, op: "upsert" | "delete"): Promise<void> {
        if (!getToken()) return;
        await db.outbox.put(outboxItem(table, entityId, op));
        void flush();
    }

    const pushers: Record<
        SyncTable,
        {
            upsert: (id: string) => Promise<Sent | undefined>;
            remove?: (id: string) => Promise<Sent>;
        }
    > = {
        apiary: {
            upsert: async (id) => {
                const r = await db.apiary.get(id);
                if (!r) return undefined;
                return $api.PUT("/apiaries/{id}", {
                    params: { path: { id } },
                    body: { name: r.name, latitude: r.latitude, longitude: r.longitude, notes: r.notes },
                });
            },
            remove: (id) => $api.DELETE("/apiaries/{id}", { params: { path: { id } } }),
        },
        hive: {
            upsert: async (id) => {
                const r = await db.hive.get(id);
                if (!r) return undefined;
                return $api.PUT("/hives/{id}", {
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
            },
            remove: (id) => $api.DELETE("/hives/{id}", { params: { path: { id } } }),
        },
        colony: {
            upsert: async (id) => {
                const r = await db.colony.get(id);
                if (!r) return undefined;
                return $api.PUT("/colonies/{id}", {
                    params: { path: { id } },
                    body: {
                        apiaryId: r.apiaryId,
                        label: r.label,
                        establishedAt: r.establishedAt,
                        origin: r.origin,
                        status: r.status,
                    },
                });
            },
        },
        queen: {
            upsert: async (id) => {
                const r = await db.queen.get(id);
                if (!r) return undefined;
                return $api.PUT("/queens/{id}", {
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
            },
            remove: (id) => $api.DELETE("/queens/{id}", { params: { path: { id } } }),
        },
        event: {
            upsert: async (id) => {
                const r = await db.event.get(id);
                if (!r) return undefined;

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
                return $api.POST("/events/batch", { body });
            },
            remove: (id) => $api.DELETE("/events/{id}", { params: { path: { id } } }),
        },
    };

    async function sendUpsert(table: SyncTable, id: string): Promise<SendResult> {
        const res = await pushers[table].upsert(id);
        if (!res) return "ok";
        return res.response.ok ? "ok" : classifyStatus(res.response.status);
    }

    async function sendDelete(table: SyncTable, id: string): Promise<SendResult> {
        const remove = pushers[table].remove;
        if (!remove) return "ok";
        const res = await remove(id);
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

        const items = pushAllItems({ apiary: apiaries, hive: hives, colony: colonies, queen: queens, event: events });

        await db.outbox.bulkPut(items);
        if (!(await flush())) throw new Error("Не удалось отправить данные на сервер");
    }

    async function pullEntity<Raw extends Dated, Local>(
        entity: SyncTable,
        fetchRows: (query: { since?: string }) => Promise<Raw[] | undefined>,
        toLocal: (raw: NoInfer<Raw>) => Local,
        put: (rows: Local[]) => Promise<unknown>,
        afterPut?: (raw: NoInfer<Raw>[]) => Promise<void>,
    ): Promise<void> {
        const meta = await db.syncMeta.get(entity);
        const data = await fetchRows(meta ? { since: meta.lastPulledAt.toISOString() } : {});
        if (!data) return;

        await put(data.map(toLocal));
        await afterPut?.(data);

        const cursor = maxCursor(data, meta?.lastPulledAt);
        if (cursor) await db.syncMeta.put({ entity, lastPulledAt: cursor });
    }

    async function dropApiaryChildren(apiaries: { id: string; deletedAt?: string | null }[]): Promise<void> {
        for (const a of apiaries) {
            if (!a.deletedAt) continue;
            await db.hive.where("apiaryId").equals(a.id).delete();
            await db.colony.where("apiaryId").equals(a.id).delete();
            await db.event.where("apiaryId").equals(a.id).delete();
        }
    }

    const pullers: (() => Promise<void>)[] = [
        () =>
            pullEntity(
                "apiary",
                async (query) => (await $api.GET("/apiaries", { params: { query } })).data,
                (d): LocalApiary => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }),
                (rows) => db.apiary.bulkPut(rows),
                (rows) => dropApiaryChildren(rows),
            ),
        () =>
            pullEntity(
                "hive",
                async (query) => (await $api.GET("/hives", { params: { query } })).data,
                (d): LocalHive => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }),
                (rows) => db.hive.bulkPut(rows),
            ),
        () =>
            pullEntity(
                "colony",
                async (query) => (await $api.GET("/colonies", { params: { query } })).data,
                (d): LocalColony => ({
                    ...d,
                    lastInspectedAt: toDateOrNull(d.lastInspectedAt),
                    updatedAt: new Date(d.updatedAt),
                }),
                (rows) => db.colony.bulkPut(rows),
            ),
        () =>
            pullEntity(
                "queen",
                async (query) => (await $api.GET("/queens", { params: { query } })).data,
                (d): LocalQueen => ({ ...d, deletedAt: toDateOrNull(d.deletedAt), updatedAt: new Date(d.updatedAt) }),
                (rows) => db.queen.bulkPut(rows),
            ),
        () =>
            pullEntity(
                "event",
                async (query) => (await $api.GET("/events", { params: { query } })).data,
                (d): LocalEvent => ({
                    ...d,
                    occurredAt: new Date(d.occurredAt),
                    deletedAt: toDateOrNull(d.deletedAt),
                    updatedAt: new Date(d.updatedAt),
                }),
                (rows) => db.event.bulkPut(rows),
            ),
    ];

    return { pull, pushAll, enqueue, flush };
}
