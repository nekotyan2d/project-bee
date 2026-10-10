import type { LocalEvent } from "~/shared/db";

import { harvestUnit } from "./constants";
import { FEED_TYPE_LABEL, FINANCE_CATEGORY_LABEL, formatMoney, HARVEST_PRODUCT_LABEL, QUEEN_ACTION_LABEL } from "./eventLabels";

export const EDITABLE_EVENT_TYPES = [
    "inspection", "super_change", "treatment", "feeding", "harvest", "swarm", "note", "finance",
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

function num(value: unknown): string | null {
    return typeof value === "number" ? String(value) : null;
}

function str(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value : null;
}

export function getEventFields(event: LocalEvent, ctx: EventFieldsContext = {}): EventField[] {
    const p = event.payload;
    const fields: EventField[] = [];
    const push = (label: string, value: string | null, align?: "start") => {
        if (value !== null) fields.push({ label, value, align });
    };

    switch (event.type) {
        case "inspection":
            push("Рамок в гнезде", num(p.framesTotal));
            push("Рамок расплода", num(p.framesBrood));
            push("Рамок корма", num(p.framesStores));
            push("Маточники", num(p.queenCells));
            push("Матка видна", p.queenSeen === true ? "да" : p.queenSeen === false ? "нет" : null);
            push(
                "Запасы",
                typeof p.storesLevel === "string" ? (STORES_LEVEL_LABEL[p.storesLevel] ?? p.storesLevel) : null,
            );
            push(
                "Нрав",
                typeof p.temperament === "string" ? (TEMPERAMENT_LABEL[p.temperament] ?? p.temperament) : null,
            );
            push("Заметки", str(p.notes), "start");
            break;
        case "super_change": {
            const delta = typeof p.delta === "number" ? p.delta : 0;
            push("Действие", delta > 0 ? `Поставлено ${String(delta)}` : `Снято ${String(-delta)}`);
            push("Причина", str(p.reason), "start");
            break;
        }
        case "treatment":
            push("Препарат", str(p.product));
            push("Дозировка", str(p.dose));
            push("Способ", str(p.method));
            push("Срок ожидания", typeof p.withdrawalDays === "number" ? `${String(p.withdrawalDays)} дн.` : null);
            break;
        case "feeding":
            push("Тип корма", typeof p.feedType === "string" ? (FEED_TYPE_LABEL[p.feedType] ?? p.feedType) : null);
            push("Количество", typeof p.amountKg === "number" ? `${String(p.amountKg)} л` : null);
            push("Концентрация", str(p.concentration));
            break;
        case "harvest":
            push("Продукт", typeof p.product === "string" ? (HARVEST_PRODUCT_LABEL[p.product] ?? p.product) : "мёд");
            push("Количество", typeof p.amountKg === "number" ? `${String(p.amountKg)} ${harvestUnit(p.product)}` : null);
            push("Рамок", num(p.framesCount));
            break;
        case "queen_change":
            push("Действие", typeof p.action === "string" ? (QUEEN_ACTION_LABEL[p.action] ?? p.action) : null);
            push("Матка", ctx.queenLabel ?? null);
            break;
        case "swarm":
            push("Рой", p.captured === true ? "поймали" : p.captured === false ? "ушёл" : null);
            push("Заметки", str(p.notes), "start");
            break;
        case "migration":
            push("Куда", ctx.hiveLabel ?? null);
            break;
        case "split":
        case "merge":
            push("Заметки", str(p.notes), "start");
            break;
        case "death":
            push("Причина", str(p.cause), "start");
            break;
        case "note":
            push("Текст", str(p.text), "start");
            break;
        case "finance":
            push("Направление", p.direction === "income" ? "Доход" : "Расход");
            push("Сумма", typeof p.amount === "number" ? formatMoney(p.amount) : null);
            push(
                "Категория",
                typeof p.category === "string" ? (FINANCE_CATEGORY_LABEL[p.category] ?? p.category) : null,
            );
            push("Что", str(p.item), "start");
            push(p.direction === "income" ? "Покупатель" : "Продавец", str(p.counterparty), "start");
            push("Заметки", str(p.notes), "start");
            break;
    }

    return fields;
}
