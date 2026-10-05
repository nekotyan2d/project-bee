import type { LocalEvent, LocalHive } from "~/shared/db";

import { FEED_TYPE_LABEL, FINANCE_CATEGORY_LABEL, formatMoney, HARVEST_PRODUCT_LABEL, QUEEN_ACTION_LABEL } from "./eventLabels";

type EventSummary = {
    icon: string;
    title: string;
    detail?: string;
};

export function getEventSummary(event: LocalEvent, hivesById: Record<string, LocalHive>): EventSummary {
    const p = event.payload;
    switch (event.type) {
        case "inspection": {
            const parts: string[] = [];
            if (typeof p.framesTotal === "number") parts.push(`гнездо: ${String(p.framesTotal)} р.`);
            if (typeof p.framesBrood === "number") parts.push(`расплод: ${String(p.framesBrood)} р.`);
            if (typeof p.framesStores === "number") parts.push(`корм: ${String(p.framesStores)} р.`);
            if (typeof p.queenCells === "number" && p.queenCells > 0) parts.push(`маточники: ${String(p.queenCells)}`);
            if (p.queenSeen === true) parts.push("матка видна");
            else if (p.queenSeen === false) parts.push("матка не видна");
            return { icon: "lucide:search", title: "Осмотр", detail: parts.join(" · ") || undefined };
        }
        case "super_change": {
            const delta = typeof p.delta === "number" ? p.delta : 0;
            const sign = delta > 0 ? `+${String(delta)}` : String(delta);
            return {
                icon: "lucide:layers",
                title: delta > 0 ? `Поставлен магазин (${sign})` : `Снят магазин (${sign})`,
                detail: typeof p.reason === "string" ? p.reason : undefined,
            };
        }
        case "treatment": {
            const parts: string[] = [];
            if (typeof p.dose === "string") parts.push(p.dose);
            if (typeof p.withdrawalDays === "number") parts.push(`⏳ ${String(p.withdrawalDays)} дн`);
            return {
                icon: "lucide:flask-conical",
                title: `Обработка: ${typeof p.product === "string" ? p.product : ""}`,
                detail: parts.join(" · ") || undefined,
            };
        }
        case "feeding": {
            const ft = typeof p.feedType === "string" ? (FEED_TYPE_LABEL[p.feedType] ?? p.feedType) : "";
            const kg = typeof p.amountKg === "number" ? ` · ${String(p.amountKg)} л` : "";
            return { icon: "lucide:droplets", title: "Подкормка", detail: `${ft}${kg}` || undefined };
        }
        case "queen_change": {
            const action = typeof p.action === "string" ? p.action : "";
            return { icon: "lucide:crown", title: QUEEN_ACTION_LABEL[action] ?? "Смена матки" };
        }
        case "harvest": {
            const kg = typeof p.amountKg === "number" ? ` · ${String(p.amountKg)} ${harvestUnit(p.product)}` : "";
            const frames = typeof p.framesCount === "number" ? ` · ${String(p.framesCount)} рам.` : "";
            const product = typeof p.product === "string" ? p.product : "honey";
            return {
                icon: "lucide:droplet",
                title: `Откачка${kg}${frames}`,
                detail: product !== "honey" ? (HARVEST_PRODUCT_LABEL[product] ?? product) : undefined,
            };
        }
        case "swarm": {
            const captured = p.captured === true ? "поймали" : p.captured === false ? "ушёл" : undefined;
            return { icon: "lucide:wind", title: "Рой", detail: captured };
        }
        case "migration": {
            const hiveId = typeof p.toHiveId === "string" ? p.toHiveId : undefined;
            const label = hiveId ? (hivesById[hiveId]?.label ?? "улей") : "улей";
            return { icon: "lucide:arrow-right", title: `Переезд в ${label}` };
        }
        case "split":
            return { icon: "lucide:git-fork", title: "Разделение семьи" };
        case "merge":
            return { icon: "lucide:git-merge", title: "Объединение семей" };
        case "death":
            return {
                icon: "lucide:x",
                title: "Гибель семьи",
                detail: typeof p.cause === "string" ? p.cause : undefined,
            };
        case "finance": {
            const income = p.direction === "income";
            const amount = typeof p.amount === "number" ? formatMoney(p.amount) : "";
            const what = typeof p.item === "string" && p.item
                ? p.item
                : typeof p.category === "string" ? (FINANCE_CATEGORY_LABEL[p.category] ?? p.category) : "";
            const who = typeof p.counterparty === "string" && p.counterparty ? p.counterparty : "";
            return {
                icon: income ? "lucide:trending-up" : "lucide:trending-down",
                title: `${income ? "Доход" : "Расход"}${amount ? `: ${amount}` : ""}`,
                detail: [what, who].filter(Boolean).join(" · ") || undefined,
            };
        }
        case "note":
            return {
                icon: "lucide:file-text",
                title: "Заметка",
                detail:
                    typeof p.text === "string"
                        ? p.text.length > 100
                            ? `${p.text.slice(0, 100)}…`
                            : p.text
                        : undefined,
            };
        default:
            return { icon: "lucide:circle-dot", title: event.type };
    }
}
