import { uuidv7 } from "uuidv7";

import type { LocalEvent, LocalQueen } from "~/shared/db";
import { STATUS_BY_EVENT_TYPE } from "~/utils/colonyState";

export type QueenAction = "introduced" | "replaced" | "superseded" | "lost" | "died";

export interface QueenChangeInput {
    apiaryId: string;
    colonyId: string;
    occurredAt: Date;
    action: QueenAction;
    newQueen?: { year?: number; breed?: string; introducedAt?: string };
}

export function useEventWriter() {
    const db = useDb();
    const { enqueue } = useSync();

    async function saveEvent(event: LocalEvent, isEdit: boolean): Promise<void> {
        const now = event.updatedAt;
        const cid = event.colonyId;
        const newStatus = STATUS_BY_EVENT_TYPE[event.type];

        await db.transaction("rw", db.event, db.colony, async () => {
            if (isEdit) await db.event.put(event);
            else await db.event.add(event);

            const colony = cid ? await db.colony.get(cid) : undefined;
            if (cid && colony) {
                const events = await db.event.where("colonyId").equals(cid).toArray();
                const next = applyColonyState(colony, deriveColonyState(events), now);
                await db.colony.put(newStatus ? { ...next, status: newStatus } : next);
            }
        });

        void enqueue("event", event.id, "upsert");
        if (cid && newStatus) void enqueue("colony", cid, "upsert");
    }

    async function saveQueenChange(input: QueenChangeInput): Promise<void> {
        const { apiaryId, colonyId, occurredAt, action } = input;
        const now = new Date();

        const colony = await db.colony.get(colonyId);
        const prevQueenId = colony?.currentQueenId;
        const prevQueen = prevQueenId && action !== "introduced" ? await db.queen.get(prevQueenId) : undefined;

        const newQueen: LocalQueen | null = input.newQueen
            ? { id: uuidv7(), colonyId, ...input.newQueen, status: "active", updatedAt: now }
            : null;

        const event: LocalEvent = {
            id: uuidv7(),
            apiaryId,
            colonyId,
            type: "queen_change",
            occurredAt,
            payload: newQueen ? { action, queenId: newQueen.id } : { action },
            updatedAt: now,
        };

        await db.transaction("rw", db.event, db.colony, db.queen, async () => {
            if (newQueen) await db.queen.add(newQueen);
            await db.event.add(event);
            if (prevQueen) await db.queen.update(prevQueen.id, { status: action, updatedAt: now });
            if (colony) {
                const next = { ...colony, updatedAt: now };
                if (newQueen) next.currentQueenId = newQueen.id;
                else delete next.currentQueenId;
                await db.colony.put(next);
            }
        });

        if (newQueen) void enqueue("queen", newQueen.id, "upsert");
        if (prevQueen) void enqueue("queen", prevQueen.id, "upsert");
        void enqueue("event", event.id, "upsert");
    }

    async function deleteEvent(id: string): Promise<void> {
        const now = new Date();

        await db.transaction("rw", db.event, db.colony, async () => {
            const event = await db.event.get(id);
            await db.event.update(id, { deletedAt: now, updatedAt: now });

            const colony = event?.colonyId ? await db.colony.get(event.colonyId) : undefined;
            if (event?.colonyId && colony) {
                const events = await db.event.where("colonyId").equals(event.colonyId).toArray();
                await db.colony.put(applyColonyState(colony, deriveColonyState(events), now));
            }
        });

        void enqueue("event", id, "delete");
    }

    return { saveEvent, saveQueenChange, deleteEvent };
}
