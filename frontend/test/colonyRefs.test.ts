import { expect, test } from "bun:test";

import { needsHive } from "../app/utils/colonyRefs";

const live = new Set(["h1", "h2"]);

test("needsHive: семья без улья нуждается в нём", () => {
    expect(needsHive({ status: "active", currentHiveId: undefined }, live)).toBe(true);
    expect(needsHive({ status: "active", currentHiveId: null }, live)).toBe(true);
});

test("needsHive: ссылка на удалённый улей считается пустой", () => {
    expect(needsHive({ status: "active", currentHiveId: "gone" }, live)).toBe(true);
});

test("needsHive: семья в живом улье не нуждается", () => {
    expect(needsHive({ status: "active", currentHiveId: "h1" }, live)).toBe(false);
});

test("needsHive: неактивные семьи (погибла, объединена, разделена) не предлагаются", () => {
    for (const status of ["dead", "merged", "split"]) {
        expect(needsHive({ status, currentHiveId: undefined }, live)).toBe(false);
        expect(needsHive({ status, currentHiveId: "gone" }, live)).toBe(false);
    }
});
