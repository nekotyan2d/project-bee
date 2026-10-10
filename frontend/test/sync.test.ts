import { expect, test } from "bun:test";

import { classifyStatus, maxCursor, toDateOrNull } from "../app/utils/sync";

test("classifyStatus: авторизация и ошибки сервера повторяем, остальное отбрасываем", () => {
    for (const s of [401, 403, 500, 502, 503]) expect(classifyStatus(s)).toBe("retry");
    for (const s of [400, 404, 409, 422]) expect(classifyStatus(s)).toBe("drop");
});

test("toDateOrNull: пустые значения дают null", () => {
    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull(undefined)).toBeNull();
    expect(toDateOrNull("")).toBeNull();
    expect(toDateOrNull("2025-06-01T00:00:00Z")).toEqual(new Date("2025-06-01T00:00:00Z"));
});

test("maxCursor: максимум по updatedAt и deletedAt, без строк возвращает prev", () => {
    const prev = new Date("2025-01-01T00:00:00Z");
    expect(maxCursor([], prev)).toEqual(prev);
    expect(maxCursor([])).toBeUndefined();

    const rows = [
        { updatedAt: "2025-03-01T00:00:00Z" },
        { updatedAt: "2025-02-01T00:00:00Z", deletedAt: "2025-05-01T00:00:00Z" },
        { updatedAt: "2025-04-01T00:00:00Z", deletedAt: null },
    ];
    expect(maxCursor(rows, prev)).toEqual(new Date("2025-05-01T00:00:00Z"));
});

test("maxCursor: курсор не откатывается назад от prev", () => {
    const prev = new Date("2025-06-01T00:00:00Z");
    expect(maxCursor([{ updatedAt: "2025-01-01T00:00:00Z" }], prev)).toEqual(prev);
});
