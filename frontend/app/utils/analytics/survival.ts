import type { LocalColony, LocalEvent } from "~/shared/db";

export type SurvivalYear = {
    year: number;
    total: number;
    lost: number;
    rate: number;
    colonies: { label: string; diedAt: Date | null }[];
};

export type SurvivalData = {
    years: SurvivalYear[];
    activeCount: number;
    deadCount: number;
};

export const EMPTY_SURVIVAL: SurvivalData = { years: [], activeCount: 0, deadCount: 0 };

export function buildSurvival(colonies: LocalColony[], deathEvents: LocalEvent[]): SurvivalData {
    const deathByColony = new Map<string, Date>();
    for (const e of deathEvents) {
        if (e.colonyId) deathByColony.set(e.colonyId, e.occurredAt);
    }

    const activeCount = colonies.filter((c) => c.status === "active").length;
    const deadColonies = colonies.filter((c) => c.status === "dead");

    const byYear = new Map<number, SurvivalYear["colonies"]>();
    for (const c of deadColonies) {
        const diedAt = deathByColony.get(c.id) ?? null;
        const year = diedAt ? diedAt.getFullYear() : 0;
        const list = byYear.get(year) ?? [];
        list.push({ label: c.label, diedAt });
        byYear.set(year, list);
    }

    const years: SurvivalYear[] = [];
    for (const [year, cols] of byYear) {
        const lost = cols.length;
        const total = lost + activeCount;
        years.push({
            year,
            total,
            lost,
            rate: total > 0 ? Math.round(((total - lost) / total) * 100) : 100,
            colonies: cols.sort((a, b) => (b.diedAt?.getTime() ?? 0) - (a.diedAt?.getTime() ?? 0)),
        });
    }

    return {
        years: years.filter((y) => y.year > 0).sort((a, b) => b.year - a.year),
        activeCount,
        deadCount: deadColonies.length,
    };
}
