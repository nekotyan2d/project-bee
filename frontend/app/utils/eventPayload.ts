type FieldKind = "int" | "float" | "bool" | "text";

// Все поля форм событий. Значение в форме всегда строка, тип задаёт разбор.
const FIELD_NAMES = [
    "framesTotal", "framesBrood", "framesStores", "queenSeen", "queenCells", "storesLevel", "temperament",
    "notes", "reason", "product", "dose", "method", "withdrawalDays", "feedType", "amountKg", "concentration",
    "framesCount", "captured", "toHiveId", "cause", "text",
] as const;

export type EventForm = Record<(typeof FIELD_NAMES)[number], string>;

// Поля payload по типу события — зеркало дискриминированного union на бэке
// (backend/src/features/events/schema.ts). super_change.delta и queen_change
// собираются в самой форме: они выводятся, а не вводятся напрямую.
const PAYLOAD_FIELDS: Record<string, Partial<Record<keyof EventForm, FieldKind>>> = {
    inspection: {
        framesTotal: "int", framesBrood: "int", framesStores: "int", queenSeen: "bool",
        queenCells: "int", storesLevel: "text", temperament: "text", notes: "text",
    },
    super_change: { reason: "text" },
    treatment: { product: "text", dose: "text", method: "text", withdrawalDays: "int" },
    feeding: { feedType: "text", amountKg: "float", concentration: "text" },
    harvest: { product: "text", amountKg: "float", framesCount: "float" },
    swarm: { captured: "bool", notes: "text" },
    migration: { toHiveId: "text" },
    split: { notes: "text" },
    merge: { notes: "text" },
    death: { cause: "text" },
    note: { text: "text" },
};

const DEFAULTS: Record<string, Partial<EventForm>> = { harvest: { product: "honey" } };

export function emptyForm(type: string | undefined): EventForm {
    const form = Object.fromEntries(FIELD_NAMES.map((name) => [name, ""])) as EventForm;
    return { ...form, ...DEFAULTS[type ?? ""] };
}

/** Форма → payload события. Пустые поля не попадают в payload. */
export function buildPayload(type: string | undefined, form: EventForm): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const [key, kind] of Object.entries(PAYLOAD_FIELDS[type ?? ""] ?? {})) {
        const raw = form[key as keyof EventForm].trim();
        if (!raw) continue;
        payload[key] =
            kind === "int" ? parseInt(raw, 10)
            : kind === "float" ? parseFloat(raw)
            : kind === "bool" ? raw === "true"
            : raw;
    }
    return payload;
}

/** payload события → значения формы (для правки). Отсутствующие поля — по умолчанию. */
export function formValues(type: string, payload: Record<string, unknown>): EventForm {
    const form = emptyForm(type);
    for (const key of Object.keys(PAYLOAD_FIELDS[type] ?? {})) {
        const value = payload[key];
        // в форму попадают только скалярные значения payload — их и умеют поля ввода
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            form[key as keyof EventForm] = String(value);
        }
    }
    return form;
}
