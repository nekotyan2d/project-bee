import type { EventType, LocalEvent } from "~/shared/db";

import { harvestUnit } from "./constants";
import {
    FEED_TYPE_LABEL,
    FINANCE_CATEGORY_LABEL,
    formatMoney,
    HARVEST_PRODUCT_LABEL,
    QUEEN_ACTION_LABEL,
} from "./eventLabels";
import { labelOf, payloadNum, payloadText } from "./payload";

export const EDITABLE_EVENT_TYPES = [
    "inspection",
    "super_change",
    "treatment",
    "feeding",
    "harvest",
    "swarm",
    "note",
    "finance",
];

export interface EventField {
    label: string;
    value: string;
    align?: "center" | "start";
}

export interface EventFieldsContext {
    hiveLabel?: string;
    queenLabel?: string;
}

const STORES_LEVEL_LABEL: Record<string, string> = {
    low: "мало",
    medium: "достаточно",
    high: "много",
};

const TEMPERAMENT_LABEL: Record<string, string> = {
    calm: "спокойный",
    nervous: "нервный",
    aggressive: "агрессивный",
};

type Payload = Record<string, unknown>;
type Entry = [label: string, value: string | null, align?: "start"];
type Describe = (p: Payload, ctx: EventFieldsContext) => Entry[];

const withUnit = (value: unknown, unit: string): string | null =>
    typeof value === "number" ? `${String(value)} ${unit}` : null;

const notes = (p: Payload): Entry => ["Заметки", payloadText(p.notes), "start"];

const DESCRIBE: Record<EventType, Describe> = {
    inspection: (p) => [
        ["Рамок в гнезде", payloadNum(p.framesTotal)],
        ["Рамок расплода", payloadNum(p.framesBrood)],
        ["Рамок корма", payloadNum(p.framesStores)],
        ["Маточники", payloadNum(p.queenCells)],
        ["Матка видна", p.queenSeen === true ? "да" : p.queenSeen === false ? "нет" : null],
        ["Запасы", labelOf(STORES_LEVEL_LABEL, p.storesLevel)],
        ["Нрав", labelOf(TEMPERAMENT_LABEL, p.temperament)],
        notes(p),
    ],

    super_change: (p) => {
        const delta = typeof p.delta === "number" ? p.delta : 0;
        return [
            ["Действие", delta > 0 ? `Поставлено ${String(delta)}` : `Снято ${String(-delta)}`],
            ["Причина", payloadText(p.reason), "start"],
        ];
    },

    treatment: (p) => [
        ["Препарат", payloadText(p.product)],
        ["Дозировка", payloadText(p.dose)],
        ["Способ", payloadText(p.method)],
        ["Срок ожидания", withUnit(p.withdrawalDays, "дн.")],
    ],

    feeding: (p) => [
        ["Тип корма", labelOf(FEED_TYPE_LABEL, p.feedType)],
        ["Количество", withUnit(p.amountKg, "л")],
        ["Концентрация", payloadText(p.concentration)],
    ],

    harvest: (p) => [
        ["Продукт", labelOf(HARVEST_PRODUCT_LABEL, p.product) ?? "мёд"],
        ["Количество", withUnit(p.amountKg, harvestUnit(p.product))],
        ["Рамок", payloadNum(p.framesCount)],
    ],

    queen_change: (p, ctx) => [
        ["Действие", labelOf(QUEEN_ACTION_LABEL, p.action)],
        ["Матка", ctx.queenLabel ?? null],
    ],

    swarm: (p) => [["Рой", p.captured === true ? "поймали" : p.captured === false ? "ушёл" : null], notes(p)],

    migration: (_p, ctx) => [["Куда", ctx.hiveLabel ?? null]],

    split: (p) => [notes(p)],

    merge: (p) => [notes(p)],

    death: (p) => [["Причина", payloadText(p.cause), "start"]],

    note: (p) => [["Текст", payloadText(p.text), "start"]],

    finance: (p) => [
        ["Направление", p.direction === "income" ? "Доход" : "Расход"],
        ["Сумма", typeof p.amount === "number" ? formatMoney(p.amount) : null],
        ["Категория", labelOf(FINANCE_CATEGORY_LABEL, p.category)],
        ["Что", payloadText(p.item), "start"],
        [p.direction === "income" ? "Покупатель" : "Продавец", payloadText(p.counterparty), "start"],
        notes(p),
    ],
};

export function getEventFields(event: LocalEvent, ctx: EventFieldsContext = {}): EventField[] {
    const describe = DESCRIBE[event.type] as Describe | undefined;
    const entries = describe?.(event.payload, ctx) ?? [];

    const fields: EventField[] = [];
    for (const [label, value, align] of entries) {
        if (value !== null) fields.push({ label, value, align });
    }
    return fields;
}
