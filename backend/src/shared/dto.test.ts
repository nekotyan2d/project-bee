import { expect, test } from "bun:test";

import { isoDates } from "@/shared/dto";

test("isoDates: Date → ISO-строка, остальные поля как есть", () => {
    const dto = isoDates({
        id: "0199a0f3-0000-7000-8000-000000000001",
        name: "Пасека",
        latitude: null,
        longitude: 42.5,
        establishedAt: "2026-06-01",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
        deletedAt: null,
    });

    expect(dto.createdAt).toBe("2026-06-01T10:00:00.000Z");
    expect(dto.establishedAt).toBe("2026-06-01"); // date-колонка уже строка, не трогаем
    expect(dto.deletedAt).toBeNull();
    expect(dto.longitude).toBe(42.5);
});
