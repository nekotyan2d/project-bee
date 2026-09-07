export const FEED_TYPE_LABEL: Record<string, string> = {
    syrup: "сироп",
    candy: "канди",
    honey: "мёд",
    pollen_substitute: "белковый корм",
    water: "вода",
};

export const HARVEST_PRODUCT_LABEL: Record<string, string> = {
    honey: "мёд",
    wax: "воск",
    propolis: "прополис",
    pollen: "пыльца",
};

export const FINANCE_CATEGORY_LABEL: Record<string, string> = {
    equipment: "инвентарь",
    foundation: "вощина",
    medication: "лекарства",
    feed: "корм",
    hives: "ульи",
    bees: "пчелопакеты и матки",
    honey: "мёд",
    wax: "воск",
    propolis: "прополис",
    pollen: "пыльца",
    pollination: "опыление",
    other: "прочее",
};

export const FINANCE_EXPENSE_CATEGORIES = ["equipment", "foundation", "medication", "feed", "hives", "bees", "other"];
export const FINANCE_INCOME_CATEGORIES = ["honey", "wax", "propolis", "pollen", "bees", "pollination", "other"];

export function formatMoney(amount: number): string {
    return `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export const QUEEN_ACTION_LABEL: Record<string, string> = {
    introduced: "Подсажена матка",
    replaced: "Матка заменена",
    superseded: "Тихая замена",
    lost: "Матка потеряна",
    died: "Матка погибла",
};
