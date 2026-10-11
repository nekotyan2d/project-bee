import { expect, test } from "bun:test";

import { buildPayload, emptyForm, formValues, isEventFormValid } from "../app/utils/eventPayload";

test("buildPayload: разбор по типу поля, пустые не попадают в payload", () => {
    const form = emptyForm("inspection");
    Object.assign(form, { framesTotal: "12", framesBrood: "", queenSeen: "false", notes: "  тихо  " });

    expect(buildPayload("inspection", form)).toEqual({ framesTotal: 12, queenSeen: false, notes: "тихо" });
});

test("buildPayload: v-model на input[type=number] кладёт в форму число, не строку", () => {
    const form = emptyForm("harvest");
    Object.assign(form, { amountKg: 3.5, framesCount: 4 });

    expect(buildPayload("harvest", form)).toEqual({ product: "honey", amountKg: 3.5, framesCount: 4 });
});

test("emptyForm: у harvest продукт по умолчанию — мёд", () => {
    expect(emptyForm("harvest").product).toBe("honey");
    expect(emptyForm("treatment").product).toBe("");
});

test("payload → форма → payload: правка события не теряет полей", () => {
    const original = { product: "wax", amountKg: 3.5, framesCount: 4 };

    expect(buildPayload("harvest", formValues("harvest", original))).toEqual(original);
});

test("formValues: отсутствующее поле остаётся значением по умолчанию", () => {
    expect(formValues("harvest", { amountKg: 2 })).toMatchObject({ product: "honey", amountKg: "2", framesCount: "" });
});

test("isEventFormValid: семья обязательна, кроме пасечных типов", () => {
    const form = emptyForm("note");
    form.text = "заметка";

    expect(isEventFormValid("note", form, undefined)).toBe(true);
    expect(isEventFormValid("inspection", emptyForm("inspection"), undefined)).toBe(false);
    expect(isEventFormValid("inspection", emptyForm("inspection"), "c1")).toBe(true);
    expect(isEventFormValid(undefined, form, "c1")).toBe(false);
});

test("isEventFormValid: обязательные поля по типу", () => {
    const treatment = emptyForm("treatment");
    expect(isEventFormValid("treatment", treatment, "c1")).toBe(false);
    treatment.product = "  Бипин ";
    expect(isEventFormValid("treatment", treatment, "c1")).toBe(true);

    const harvest = emptyForm("harvest");
    expect(isEventFormValid("harvest", harvest, undefined)).toBe(false);
    harvest.framesCount = "3";
    expect(isEventFormValid("harvest", harvest, undefined)).toBe(true);

    const finance = emptyForm("finance");
    finance.amount = "0";
    expect(isEventFormValid("finance", finance, undefined)).toBe(false);
    finance.amount = "150.5";
    expect(isEventFormValid("finance", finance, undefined)).toBe(true);

    const migration = emptyForm("migration");
    expect(isEventFormValid("migration", migration, "c1")).toBe(false);
    migration.toHiveId = "h1";
    expect(isEventFormValid("migration", migration, "c1")).toBe(true);
});
