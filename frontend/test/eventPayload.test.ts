import { expect, test } from "bun:test";

import { buildPayload, emptyForm, formValues } from "../app/utils/eventPayload";

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
