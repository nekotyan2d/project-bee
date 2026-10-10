type FieldKind = "int" | "float" | "bool" | "text";

const FIELD_NAMES = [
    "framesTotal",
    "framesBrood",
    "framesStores",
    "queenSeen",
    "queenCells",
    "storesLevel",
    "temperament",
    "notes",
    "reason",
    "product",
    "dose",
    "method",
    "withdrawalDays",
    "feedType",
    "amountKg",
    "concentration",
    "framesCount",
    "captured",
    "toHiveId",
    "cause",
    "text",
    "direction",
    "amount",
    "category",
    "counterparty",
    "item",
] as const;

export type EventForm = Record<(typeof FIELD_NAMES)[number], string | number>;
const PAYLOAD_FIELDS: Record<string, Partial<Record<keyof EventForm, FieldKind>>> = {
    inspection: {
        framesTotal: "int",
        framesBrood: "int",
        framesStores: "int",
        queenSeen: "bool",
        queenCells: "int",
        storesLevel: "text",
        temperament: "text",
        notes: "text",
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
    finance: {
        direction: "text",
        amount: "float",
        category: "text",
        counterparty: "text",
        item: "text",
        notes: "text",
    },
};

const DEFAULTS: Record<string, Partial<EventForm>> = {
    harvest: { product: "honey" },
    finance: { direction: "expense", category: "equipment" },
};

export function emptyForm(type: string | undefined): EventForm {
    const form = Object.fromEntries(FIELD_NAMES.map((name) => [name, ""])) as EventForm;
    return { ...form, ...DEFAULTS[type ?? ""] };
}

export function buildPayload(type: string | undefined, form: EventForm): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const [key, kind] of Object.entries(PAYLOAD_FIELDS[type ?? ""] ?? {})) {
        const raw = String(form[key as keyof EventForm]).trim();
        if (!raw) continue;
        payload[key] =
            kind === "int"
                ? parseInt(raw, 10)
                : kind === "float"
                  ? parseFloat(raw)
                  : kind === "bool"
                    ? raw === "true"
                    : raw;
    }
    return payload;
}

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

export const APIARY_SCOPED_TYPES = ["note", "harvest", "finance"];

const FORM_RULES: Record<string, (form: EventForm) => boolean> = {
    treatment: (f) => !!String(f.product).trim(),
    feeding: (f) => !!f.feedType,
    harvest: (f) => !!f.amountKg || !!f.framesCount,
    migration: (f) => !!f.toHiveId,
    note: (f) => !!String(f.text).trim(),
    finance: (f) => parseFloat(String(f.amount)) > 0,
};

export function isEventFormValid(type: string | undefined, form: EventForm, colonyId: string | undefined): boolean {
    if (!type) return false;
    if (!colonyId && !APIARY_SCOPED_TYPES.includes(type)) return false;
    return FORM_RULES[type]?.(form) ?? true;
}
