import type { EventType, LocalEvent, LocalHive } from "~/shared/db";

import { harvestUnit } from "./constants";
import {
    FEED_TYPE_LABEL,
    FINANCE_CATEGORY_LABEL,
    formatMoney,
    HARVEST_PRODUCT_LABEL,
    QUEEN_ACTION_LABEL,
} from "./eventLabels";
import { labelOf } from "./payload";

type EventSummary = {
    icon: string;
    title: string;
    detail?: string;
};

type Payload = Record<string, unknown>;
type Describe = (p: Payload, hivesById: Record<string, LocalHive>) => EventSummary;

const NOTE_PREVIEW_LENGTH = 100;

const joined = (parts: string[]): string | undefined => parts.join(" · ") || undefined;

const DESCRIBE: Record<EventType, Describe> = {
    inspection: (p) => {
        const parts: string[] = [];
        if (typeof p.framesTotal === "number") parts.push(`гнездо: ${String(p.framesTotal)} р.`);
        if (typeof p.framesBrood === "number") parts.push(`расплод: ${String(p.framesBrood)} р.`);
        if (typeof p.framesStores === "number") parts.push(`корм: ${String(p.framesStores)} р.`);
        if (typeof p.queenCells === "number" && p.queenCells > 0) parts.push(`маточники: ${String(p.queenCells)}`);
        if (p.queenSeen === true) parts.push("матка видна");
        else if (p.queenSeen === false) parts.push("матка не видна");
        return { icon: "lucide:search", title: "Осмотр", detail: joined(parts) };
    },

    super_change: (p) => {
        const delta = typeof p.delta === "number" ? p.delta : 0;
        const sign = delta > 0 ? `+${String(delta)}` : String(delta);
        return {
            icon: "lucide:layers",
            title: delta > 0 ? `Поставлен магазин (${sign})` : `Снят магазин (${sign})`,
            detail: typeof p.reason === "string" ? p.reason : undefined,
        };
    },

    treatment: (p) => {
        const parts: string[] = [];
        if (typeof p.dose === "string") parts.push(p.dose);
        if (typeof p.withdrawalDays === "number") parts.push(`⏳ ${String(p.withdrawalDays)} дн`);
        return {
            icon: "lucide:flask-conical",
            title: `Обработка: ${typeof p.product === "string" ? p.product : ""}`,
            detail: joined(parts),
        };
    },

    feeding: (p) => {
        const type = labelOf(FEED_TYPE_LABEL, p.feedType) ?? "";
        const amount = typeof p.amountKg === "number" ? ` · ${String(p.amountKg)} л` : "";
        return { icon: "lucide:droplets", title: "Подкормка", detail: `${type}${amount}` || undefined };
    },

    queen_change: (p) => {
        const action = typeof p.action === "string" ? p.action : "";
        return { icon: "lucide:crown", title: QUEEN_ACTION_LABEL[action] ?? "Смена матки" };
    },

    harvest: (p) => {
        const amount = typeof p.amountKg === "number" ? ` · ${String(p.amountKg)} ${harvestUnit(p.product)}` : "";
        const frames = typeof p.framesCount === "number" ? ` · ${String(p.framesCount)} рам.` : "";
        const product = typeof p.product === "string" ? p.product : "honey";
        return {
            icon: "lucide:droplet",
            title: `Откачка${amount}${frames}`,
            detail: product !== "honey" ? (labelOf(HARVEST_PRODUCT_LABEL, product) ?? undefined) : undefined,
        };
    },

    swarm: (p) => {
        const captured = p.captured === true ? "поймали" : p.captured === false ? "ушёл" : undefined;
        return { icon: "lucide:wind", title: "Рой", detail: captured };
    },

    migration: (p, hivesById) => {
        const hiveId = typeof p.toHiveId === "string" ? p.toHiveId : undefined;
        const label = hiveId ? (hivesById[hiveId]?.label ?? "улей") : "улей";
        return { icon: "lucide:arrow-right", title: `Переезд в ${label}` };
    },

    split: () => ({ icon: "lucide:git-fork", title: "Разделение семьи" }),

    merge: () => ({ icon: "lucide:git-merge", title: "Объединение семей" }),

    death: (p) => ({
        icon: "lucide:x",
        title: "Гибель семьи",
        detail: typeof p.cause === "string" ? p.cause : undefined,
    }),

    finance: (p) => {
        const income = p.direction === "income";
        const amount = typeof p.amount === "number" ? formatMoney(p.amount) : "";
        const what =
            typeof p.item === "string" && p.item ? p.item : (labelOf(FINANCE_CATEGORY_LABEL, p.category) ?? "");
        const who = typeof p.counterparty === "string" && p.counterparty ? p.counterparty : "";
        return {
            icon: income ? "lucide:trending-up" : "lucide:trending-down",
            title: `${income ? "Доход" : "Расход"}${amount ? `: ${amount}` : ""}`,
            detail: joined([what, who].filter(Boolean)),
        };
    },

    note: (p) => {
        const text = typeof p.text === "string" ? p.text : undefined;
        const preview = text && text.length > NOTE_PREVIEW_LENGTH ? `${text.slice(0, NOTE_PREVIEW_LENGTH)}…` : text;
        return { icon: "lucide:file-text", title: "Заметка", detail: preview };
    },
};

export function getEventSummary(event: LocalEvent, hivesById: Record<string, LocalHive>): EventSummary {
    const describe = DESCRIBE[event.type] as Describe | undefined;
    return describe ? describe(event.payload, hivesById) : { icon: "lucide:circle-dot", title: event.type };
}
