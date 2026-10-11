import { expect, test } from "bun:test";

import type { LocalEvent, LocalHive } from "../app/shared/db";

import { formatMoney } from "../app/utils/eventLabels";
import { getEventFields } from "../app/utils/eventDetails";
import { getEventSummary } from "../app/utils/eventSummary";

function ev(type: string, payload: Record<string, unknown> = {}): LocalEvent {
    return {
        id: "e",
        apiaryId: "a",
        colonyId: "c",
        type,
        occurredAt: new Date("2025-06-01T12:00:00"),
        payload,
        updatedAt: new Date("2025-06-01T12:00:00"),
    } as LocalEvent;
}

const hives = { h1: { id: "h1", label: "Улей 2" } as LocalHive };

const summary = (type: string, payload: Record<string, unknown> = {}) => getEventSummary(ev(type, payload), hives);

const fields = (type: string, payload: Record<string, unknown> = {}, ctx = {}) =>
    getEventFields(ev(type, payload), ctx).map((f) => `${f.label}: ${f.value}${f.align ? ` [${f.align}]` : ""}`);

test("summary: осмотр собирает только заполненные показатели", () => {
    expect(
        summary("inspection", { framesTotal: 12, framesBrood: 6, framesStores: 4, queenCells: 2, queenSeen: true }),
    ).toEqual({
        icon: "lucide:search",
        title: "Осмотр",
        detail: "гнездо: 12 р. · расплод: 6 р. · корм: 4 р. · маточники: 2 · матка видна",
    });
    expect(summary("inspection", { queenCells: 0, queenSeen: false }).detail).toBe("матка не видна");
    expect(summary("inspection").detail).toBeUndefined();
});

test("summary: магазины — знак по delta, причина в detail", () => {
    expect(summary("super_change", { delta: 2, reason: "взяток" })).toMatchObject({
        title: "Поставлен магазин (+2)",
        detail: "взяток",
    });
    expect(summary("super_change", { delta: -1 }).title).toBe("Снят магазин (-1)");
    expect(summary("super_change").title).toBe("Снят магазин (0)");
});

test("summary: обработка и подкормка", () => {
    expect(summary("treatment", { product: "Бипин", dose: "1 мл", withdrawalDays: 7 })).toMatchObject({
        title: "Обработка: Бипин",
        detail: "1 мл · ⏳ 7 дн",
    });
    expect(summary("treatment").detail).toBeUndefined();

    expect(summary("feeding", { feedType: "syrup", amountKg: 2 }).detail).toBe("сироп · 2 л");
    expect(summary("feeding", { feedType: "unknown" }).detail).toBe("unknown");
    expect(summary("feeding").detail).toBeUndefined();
});

test("summary: смена матки берёт подпись действия, иначе общий заголовок", () => {
    expect(summary("queen_change", { action: "replaced" }).title).toBe("Матка заменена");
    expect(summary("queen_change", { action: "???" }).title).toBe("Смена матки");
});

test("summary: откачка — мёд в литрах без продукта, остальное с продуктом в detail", () => {
    expect(summary("harvest", { amountKg: 3.5, framesCount: 4 })).toMatchObject({
        title: "Откачка · 3.5 л · 4 рам.",
        detail: undefined,
    });
    expect(summary("harvest", { amountKg: 2, product: "wax" })).toMatchObject({
        title: "Откачка · 2 кг",
        detail: "воск",
    });
});

test("summary: рой, переезд, разделение, объединение, гибель", () => {
    expect(summary("swarm", { captured: true }).detail).toBe("поймали");
    expect(summary("swarm", { captured: false }).detail).toBe("ушёл");
    expect(summary("swarm").detail).toBeUndefined();

    expect(summary("migration", { toHiveId: "h1" }).title).toBe("Переезд в Улей 2");
    expect(summary("migration", { toHiveId: "nope" }).title).toBe("Переезд в улей");
    expect(summary("migration").title).toBe("Переезд в улей");

    expect(summary("split").title).toBe("Разделение семьи");
    expect(summary("merge").title).toBe("Объединение семей");
    expect(summary("death", { cause: "бескормица" })).toMatchObject({ title: "Гибель семьи", detail: "бескормица" });
});

test("summary: финансы — направление, сумма, что и с кем", () => {
    expect(summary("finance", { direction: "income", amount: 150, item: "Мёд, 50 кг", counterparty: "Иван" })).toEqual({
        icon: "lucide:trending-up",
        title: `Доход: ${formatMoney(150)}`,
        detail: "Мёд, 50 кг · Иван",
    });
    expect(summary("finance", { direction: "expense", category: "feed" })).toEqual({
        icon: "lucide:trending-down",
        title: "Расход",
        detail: "корм",
    });
});

test("summary: заметка обрезается на 100 символах", () => {
    expect(summary("note", { text: "коротко" }).detail).toBe("коротко");
    expect(summary("note", { text: "a".repeat(120) }).detail).toBe(`${"a".repeat(100)}…`);
    expect(summary("note").detail).toBeUndefined();
});

test("summary: неизвестный тип с сервера не ломает ленту", () => {
    expect(summary("brand_new")).toEqual({ icon: "lucide:circle-dot", title: "brand_new" });
});

test("fields: осмотр", () => {
    expect(
        fields("inspection", {
            framesTotal: 12,
            queenCells: 0,
            queenSeen: false,
            storesLevel: "medium",
            temperament: "calm",
            notes: "тихо",
        }),
    ).toEqual([
        "Рамок в гнезде: 12",
        "Маточники: 0",
        "Матка видна: нет",
        "Запасы: достаточно",
        "Нрав: спокойный",
        "Заметки: тихо [start]",
    ]);
    expect(fields("inspection")).toEqual([]);
});

test("fields: магазины — действие по знаку delta", () => {
    expect(fields("super_change", { delta: 2, reason: "взяток" })).toEqual([
        "Действие: Поставлено 2",
        "Причина: взяток [start]",
    ]);
    expect(fields("super_change", { delta: -3 })).toEqual(["Действие: Снято 3"]);
});

test("fields: обработка, подкормка, откачка", () => {
    expect(fields("treatment", { product: "Бипин", dose: "1 мл", method: "пары", withdrawalDays: 7 })).toEqual([
        "Препарат: Бипин",
        "Дозировка: 1 мл",
        "Способ: пары",
        "Срок ожидания: 7 дн.",
    ]);
    expect(fields("feeding", { feedType: "syrup", amountKg: 2, concentration: "1:1" })).toEqual([
        "Тип корма: сироп",
        "Количество: 2 л",
        "Концентрация: 1:1",
    ]);
    expect(fields("harvest", { amountKg: 3, framesCount: 4 })).toEqual(["Продукт: мёд", "Количество: 3 л", "Рамок: 4"]);
    expect(fields("harvest", { product: "wax", amountKg: 2 })).toEqual(["Продукт: воск", "Количество: 2 кг"]);
});

test("fields: смена матки и переезд берут подписи из контекста", () => {
    expect(fields("queen_change", { action: "replaced" }, { queenLabel: "Карника 2024" })).toEqual([
        "Действие: Матка заменена",
        "Матка: Карника 2024",
    ]);
    expect(fields("migration", {}, { hiveLabel: "Улей 2" })).toEqual(["Куда: Улей 2"]);
    expect(fields("migration")).toEqual([]);
});

test("fields: рой, разделение, объединение, гибель, заметка", () => {
    expect(fields("swarm", { captured: true, notes: "на яблоне" })).toEqual([
        "Рой: поймали",
        "Заметки: на яблоне [start]",
    ]);
    expect(fields("split", { notes: "отводок" })).toEqual(["Заметки: отводок [start]"]);
    expect(fields("merge", { notes: "с семьёй 2" })).toEqual(["Заметки: с семьёй 2 [start]"]);
    expect(fields("death", { cause: "слёт" })).toEqual(["Причина: слёт [start]"]);
    expect(fields("note", { text: "привет" })).toEqual(["Текст: привет [start]"]);
    expect(fields("note", { text: "   " })).toEqual([]);
});

test("fields: финансы — подпись контрагента зависит от направления", () => {
    expect(
        fields("finance", { direction: "income", amount: 150, category: "honey", item: "Мёд", counterparty: "Иван" }),
    ).toEqual([
        "Направление: Доход",
        `Сумма: ${formatMoney(150)}`,
        "Категория: мёд",
        "Что: Мёд [start]",
        "Покупатель: Иван [start]",
    ]);
    expect(fields("finance", { counterparty: "Магазин" })).toEqual([
        "Направление: Расход",
        "Продавец: Магазин [start]",
    ]);
});

test("fields: неизвестный тип даёт пустой список", () => {
    expect(fields("brand_new", { x: 1 })).toEqual([]);
});
