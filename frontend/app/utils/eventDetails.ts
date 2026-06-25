import type { LocalEvent } from "~/shared/db";

// Типы событий, которые можно редактировать через events/new (форма умеет их prefill'ить).
// Жизненный цикл (queen_change/migration/split/merge/death) меняет состояние семьи/связи —
// его правка не поддержана, поэтому edit для них скрыт/запрещён.
export const EDITABLE_EVENT_TYPES = ["inspection", "super_change", "treatment", "feeding", "harvest", "swarm", "note"];

export interface EventField {
    label: string;
    value: string;
}

export interface EventFieldsContext {
    hiveLabel?: string;
    queenLabel?: string;
}

const FEED_TYPE_LABEL: Record<string, string> = {
    syrup: "сироп",
    candy: "канди",
    honey: "мёд",
    pollen_substitute: "белковый корм",
    water: "вода",
};

const HARVEST_PRODUCT_LABEL: Record<string, string> = {
    honey: "мёд",
    wax: "воск",
    propolis: "прополис",
    pollen: "пыльца",
};

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

const QUEEN_ACTION_LABEL: Record<string, string> = {
    introduced: "Подсажена новая матка",
    replaced: "Матка заменена",
    superseded: "Тихая смена",
    lost: "Матка потеряна",
    died: "Матка погибла",
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
    const push = (label: string, value: string | null) => {
        if (value !== null) fields.push({ label, value });
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
            push("Заметки", str(p.notes));
            break;
        case "super_change": {
            const delta = typeof p.delta === "number" ? p.delta : 0;
            push("Действие", delta > 0 ? `Поставлено ${String(delta)}` : `Снято ${String(-delta)}`);
            push("Причина", str(p.reason));
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
            push("Количество", typeof p.amountKg === "number" ? `${String(p.amountKg)} кг` : null);
            push("Концентрация", str(p.concentration));
            break;
        case "harvest":
            push("Продукт", typeof p.product === "string" ? (HARVEST_PRODUCT_LABEL[p.product] ?? p.product) : "мёд");
            push("Количество", typeof p.amountKg === "number" ? `${String(p.amountKg)} кг` : null);
            break;
        case "queen_change":
            push("Действие", typeof p.action === "string" ? (QUEEN_ACTION_LABEL[p.action] ?? p.action) : null);
            push("Матка", ctx.queenLabel ?? null);
            break;
        case "swarm":
            push("Рой", p.captured === true ? "поймали" : p.captured === false ? "ушёл" : null);
            push("Заметки", str(p.notes));
            break;
        case "migration":
            push("Куда", ctx.hiveLabel ?? null);
            break;
        case "split":
        case "merge":
            push("Заметки", str(p.notes));
            break;
        case "death":
            push("Причина", str(p.cause));
            break;
        case "note":
            push("Текст", str(p.text));
            break;
    }

    return fields;
}
