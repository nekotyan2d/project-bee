export const CARD_W = 90;
export const CARD_H = 72;

const GRID_COL_W = 110;
const GRID_ROW_H = 90;
const COLS = 4;
const PAD = 16;
const GAP = 12;
const SNAP_RANGE = 40;

export type Pos = { x: number; y: number };

const hasPosition = (h: { x?: number | null; y?: number | null }): boolean =>
    Number.isFinite(h.x) && Number.isFinite(h.y);

export function placeHives(hives: ReadonlyArray<{ x?: number | null; y?: number | null }>): Pos[] {
    const placed = hives.filter(hasPosition);
    const anchorX = placed.length ? Math.min(...placed.map((h) => h.x as number)) : PAD;
    const anchorY = placed.length ? Math.max(...placed.map((h) => (h.y as number) + CARD_H)) + GAP : PAD;
    let free = 0;

    return hives.map((h) => {
        if (hasPosition(h)) return { x: h.x as number, y: h.y as number };
        const pos = {
            x: anchorX + (free % COLS) * GRID_COL_W,
            y: anchorY + Math.floor(free / COLS) * GRID_ROW_H,
        };
        free++;
        return pos;
    });
}

function overlaps(a: Pos, b: Pos): boolean {
    return a.x < b.x + CARD_W + GAP && a.x + CARD_W + GAP > b.x && a.y < b.y + CARD_H + GAP && a.y + CARD_H + GAP > b.y;
}

export function snapAndConstrain(others: ReadonlyArray<Pos>, raw: Pos): Pos {
    let best = { ...raw };
    let bestDist = SNAP_RANGE;

    for (const o of others) {
        const candidates: Pos[] = [
            { x: o.x + CARD_W + GAP, y: o.y },
            { x: o.x - CARD_W - GAP, y: o.y },
            { x: o.x, y: o.y + CARD_H + GAP },
            { x: o.x, y: o.y - CARD_H - GAP },
            { x: o.x + CARD_W + GAP, y: o.y + CARD_H + GAP },
            { x: o.x - CARD_W - GAP, y: o.y - CARD_H - GAP },
            { x: o.x + CARD_W + GAP, y: o.y - CARD_H - GAP },
            { x: o.x - CARD_W - GAP, y: o.y + CARD_H + GAP },
        ];
        for (const c of candidates) {
            const d = Math.hypot(c.x - raw.x, c.y - raw.y);
            if (d < bestDist) {
                bestDist = d;
                best = c;
            }
        }
    }

    for (const o of others) {
        if (!overlaps(best, o)) continue;
        const dx = best.x + CARD_W / 2 - (o.x + CARD_W / 2);
        const dy = best.y + CARD_H / 2 - (o.y + CARD_H / 2);
        if (Math.abs(dx) >= Math.abs(dy)) {
            best = { ...best, x: dx >= 0 ? o.x + CARD_W + GAP : o.x - CARD_W - GAP };
        } else {
            best = { ...best, y: dy >= 0 ? o.y + CARD_H + GAP : o.y - CARD_H - GAP };
        }
    }

    if (others.length > 0) {
        const margin = GRID_COL_W * 1.5;
        const minX = Math.min(...others.map((o) => o.x));
        const minY = Math.min(...others.map((o) => o.y));
        const maxX = Math.max(...others.map((o) => o.x + CARD_W));
        const maxY = Math.max(...others.map((o) => o.y + CARD_H));
        best = {
            x: Math.min(Math.max(best.x, minX - margin), maxX - CARD_W + margin),
            y: Math.min(Math.max(best.y, minY - margin), maxY - CARD_H + margin),
        };
    }

    return best;
}

export function centerOffset(positions: ReadonlyArray<Pos>, stageW: number, stageH: number): Pos {
    const minX = Math.min(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxX = Math.max(...positions.map((p) => p.x + CARD_W));
    const maxY = Math.max(...positions.map((p) => p.y + CARD_H));
    return {
        x: Math.round(stageW / 2 - (minX + maxX) / 2),
        y: Math.round(stageH / 2 - (minY + maxY) / 2),
    };
}
