import { expect, test } from "bun:test";

import { centerOffset, placeHives, snapAndConstrain } from "../app/utils/hiveMapLayout";

test("placeHives: без размещённых ульи встают сеткой в 4 колонки от угла", () => {
    const positions = placeHives([{}, {}, {}, {}, {}]);

    expect(positions).toEqual([
        { x: 16, y: 16 },
        { x: 126, y: 16 },
        { x: 236, y: 16 },
        { x: 346, y: 16 },
        { x: 16, y: 106 },
    ]);
});

test("placeHives: размещённые не двигаются, новые встают под ними", () => {
    const positions = placeHives([{ x: 100, y: 50 }, {}, {}]);

    expect(positions).toEqual([
        { x: 100, y: 50 },
        { x: 100, y: 134 },
        { x: 210, y: 134 },
    ]);
});

test("placeHives: null и NaN считаются отсутствием координат", () => {
    expect(
        placeHives([
            { x: null, y: null },
            { x: Number.NaN, y: 5 },
        ]),
    ).toEqual([
        { x: 16, y: 16 },
        { x: 126, y: 16 },
    ]);
});

test("snapAndConstrain: без других ульев позиция не меняется", () => {
    expect(snapAndConstrain([], { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
});

test("snapAndConstrain: прилипает к ближайшему соседу в пределах 40 px", () => {
    expect(snapAndConstrain([{ x: 0, y: 0 }], { x: 105, y: 3 })).toEqual({ x: 102, y: 0 });
});

test("snapAndConstrain: выбирает ближайшего из нескольких соседей", () => {
    const others = [
        { x: 0, y: 0 },
        { x: 500, y: 0 },
    ];
    expect(snapAndConstrain(others, { x: 101, y: 2 })).toEqual({ x: 102, y: 0 });
});

test("snapAndConstrain: выталкивается из пересечения по оси с большим смещением", () => {
    expect(snapAndConstrain([{ x: 0, y: 0 }], { x: 10, y: 10 })).toEqual({ x: 102, y: 10 });
    expect(snapAndConstrain([{ x: 0, y: 0 }], { x: 5, y: 30 })).toEqual({ x: 5, y: 84 });
});

test("snapAndConstrain: не уходит дальше 1.5 колонки от поля ульев", () => {
    expect(snapAndConstrain([{ x: 0, y: 0 }], { x: 300, y: 300 })).toEqual({ x: 165, y: 165 });
    expect(snapAndConstrain([{ x: 0, y: 0 }], { x: -300, y: -300 })).toEqual({ x: -165, y: -165 });
});

test("centerOffset: центр габаритов всех карточек попадает в центр сцены", () => {
    const offset = centerOffset(
        [
            { x: 0, y: 0 },
            { x: 110, y: 90 },
        ],
        400,
        300,
    );

    expect(offset).toEqual({ x: 100, y: 69 });
});
