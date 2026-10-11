import type { LocalColony, LocalEvent } from "~/shared/db";

export type HarvestRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    amountKg: number | null;
    framesCount: number | null;
    product: string;
    year: number;
};

export type SeasonData = {
    year: number;
    rows: HarvestRow[];
    totalByProduct: Record<string, number>;
    framesByProduct: Record<string, number>;
};

export function buildHarvestSeasons(events: LocalEvent[], colonies: Record<string, LocalColony>): SeasonData[] {
    const rows: HarvestRow[] = events
        .map((e) => ({
            event: e,
            colony: e.colonyId ? colonies[e.colonyId] : undefined,
            amountKg: typeof e.payload.amountKg === "number" ? e.payload.amountKg : null,
            framesCount: typeof e.payload.framesCount === "number" ? e.payload.framesCount : null,
            product: typeof e.payload.product === "string" ? e.payload.product : "honey",
            year: e.occurredAt.getFullYear(),
        }))
        .sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());

    const byYear = new Map<number, HarvestRow[]>();
    for (const row of rows) {
        const list = byYear.get(row.year) ?? [];
        list.push(row);
        byYear.set(row.year, list);
    }

    const seasons: SeasonData[] = [];
    for (const [year, yearRows] of byYear) {
        const totalByProduct: Record<string, number> = {};
        const framesByProduct: Record<string, number> = {};
        for (const r of yearRows) {
            if (r.amountKg !== null) totalByProduct[r.product] = (totalByProduct[r.product] ?? 0) + r.amountKg;
            if (r.framesCount !== null) framesByProduct[r.product] = (framesByProduct[r.product] ?? 0) + r.framesCount;
        }
        seasons.push({ year, rows: yearRows, totalByProduct, framesByProduct });
    }

    return seasons.sort((a, b) => b.year - a.year);
}
