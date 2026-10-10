import { expect, test } from "bun:test";

import type { LocalColony, LocalHive, LocalQueen } from "../app/shared/db";

import {
    colonyFields,
    colonyToForm,
    emptyColonyForm,
    emptyHiveForm,
    emptyQueenForm,
    hiveFields,
    hiveToForm,
    queenFields,
    queenToForm,
} from "../app/utils/entityForms";

test("hiveFields: название обрезается, пустые поля не попадают в сущность", () => {
    const f = { ...emptyHiveForm("  Улей №1  "), frameCount: "12", type: "", color: "" };

    expect(hiveFields(f)).toEqual({
        label: "Улей №1",
        type: undefined,
        frameCount: 12,
        color: undefined,
        status: "active",
    });
});

test("hive: сущность → форма → поля не теряют данных", () => {
    const hive = {
        id: "h",
        apiaryId: "a",
        label: "Дадан",
        type: "dadant",
        frameCount: 12,
        color: "#ffcc00",
        status: "inactive",
        updatedAt: new Date(),
    } as LocalHive;

    expect(hiveFields(hiveToForm(hive))).toEqual({
        label: "Дадан",
        type: "dadant",
        frameCount: 12,
        color: "#ffcc00",
        status: "inactive",
    });
});

test("queenFields: год — число, текст обрезается, пустое → undefined", () => {
    const f = { ...emptyQueenForm(), year: "2024", breed: " Карника ", origin: "   ", introducedAt: "2025-05-01" };

    expect(queenFields(f)).toEqual({
        year: 2024,
        breed: "Карника",
        origin: undefined,
        introducedAt: "2025-05-01",
        status: "active",
    });
});

test("queen: сущность → форма → поля не теряют данных", () => {
    const queen = {
        id: "q",
        year: 2023,
        breed: "Бакфаст",
        origin: "питомник",
        introducedAt: "2024-06-10",
        status: "replaced",
        updatedAt: new Date(),
    } as LocalQueen;

    expect(queenFields(queenToForm(queen))).toEqual({
        year: 2023,
        breed: "Бакфаст",
        origin: "питомник",
        introducedAt: "2024-06-10",
        status: "replaced",
    });
    expect(queenToForm({ ...queen, year: undefined, breed: undefined }).year).toBe("");
});

test("colonyFields / colonyToForm: круговой разбор", () => {
    const colony = {
        id: "c",
        apiaryId: "a",
        label: "Семья 1",
        establishedAt: "2024-05-01",
        origin: "отводок",
        status: "active",
        superCount: 0,
        updatedAt: new Date(),
    } as LocalColony;

    expect(colonyFields(colonyToForm(colony))).toEqual({
        label: "Семья 1",
        establishedAt: "2024-05-01",
        origin: "отводок",
        status: "active",
    });
    expect(colonyFields({ ...emptyColonyForm("  X "), origin: " " })).toEqual({
        label: "X",
        establishedAt: undefined,
        origin: undefined,
        status: "active",
    });
});
