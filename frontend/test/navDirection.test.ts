import { expect, test } from "bun:test";

import { consumeBackNavigation, markBackNavigation, navDirection, navLevel } from "../app/utils/navDirection";

test("navLevel: вкладки 0, страницы сущностей 1, формы 2", () => {
    expect(navLevel("/")).toBe(0);
    expect(navLevel("/analytics")).toBe(0);
    expect(navLevel("/settings")).toBe(0);
    expect(navLevel("/hives/abc")).toBe(1);
    expect(navLevel("/events/abc")).toBe(1);
    expect(navLevel("/hives/new")).toBe(2);
    expect(navLevel("/hives/abc/edit")).toBe(2);
    expect(navLevel("/events/new?colonyId=1&type=inspection")).toBe(2);
});

test("navDirection: вкладки идут по порядку", () => {
    expect(navDirection("/", "/analytics")).toBe("forward");
    expect(navDirection("/analytics", "/settings")).toBe("forward");
    expect(navDirection("/settings", "/")).toBe("back");
    expect(navDirection("/settings", "/analytics")).toBe("back");
});

test("navDirection: глубже — вперёд, выше — назад", () => {
    expect(navDirection("/", "/colonies/abc")).toBe("forward");
    expect(navDirection("/colonies/abc", "/events/new?colonyId=abc&type=note")).toBe("forward");
    expect(navDirection("/events/new", "/colonies/abc")).toBe("back");
    expect(navDirection("/colonies/abc", "/")).toBe("back");
    expect(navDirection("/hives/abc/edit", "/hives/abc")).toBe("back");
});

test("navDirection: на одном уровне — вперёд", () => {
    expect(navDirection("/colonies/a", "/events/b")).toBe("forward");
});

test("markBackNavigation: отметка действует один раз", () => {
    expect(consumeBackNavigation()).toBe(false);
    markBackNavigation();
    expect(consumeBackNavigation()).toBe(true);
    expect(consumeBackNavigation()).toBe(false);
});
