<script setup lang="ts">
import type { LocalColony, LocalEvent } from "~/shared/db";

useHead({ title: "Аналитика — Пасека" });

const db = useDb();

type Tab = "harvest" | "treatment" | "feeding" | "survival";
const tab = ref<Tab>("harvest");

const PRODUCTS: Record<string, string> = { honey: "Мёд", wax: "Воск", propolis: "Прополис" };

type HarvestRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    amountKg: number;
    product: string;
    year: number;
};

type SeasonData = {
    year: number;
    rows: HarvestRow[];
    totalByProduct: Record<string, number>;
};

const { data: harvestData, loading: harvestLoading } = useLiveQuery<SeasonData[]>(async () => {
    const events = await db.event
        .where("type")
        .equals("harvest")
        .filter((e) => !e.deletedAt)
        .toArray();

    if (events.length === 0) return [];

    const colonyIds = [...new Set(events.map((e) => e.colonyId).filter((id): id is string => !!id))];
    const coloniesArr = await db.colony.bulkGet(colonyIds);
    const colonyMap: Record<string, LocalColony> = {};
    for (const c of coloniesArr) {
        if (c) colonyMap[c.id] = c;
    }

    const rows: HarvestRow[] = events
        .map((e) => ({
            event: e,
            colony: e.colonyId ? colonyMap[e.colonyId] : undefined,
            amountKg: typeof e.payload.amountKg === "number" ? e.payload.amountKg : 0,
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
        for (const r of yearRows) {
            totalByProduct[r.product] = (totalByProduct[r.product] ?? 0) + r.amountKg;
        }
        seasons.push({ year, rows: yearRows, totalByProduct });
    }

    return seasons.sort((a, b) => b.year - a.year);
}, []);

const selectedYear = ref<number | null>(null);

const currentSeason = computed<SeasonData | null>(() => {
    if (harvestData.value.length === 0) return null;
    const first = harvestData.value[0];
    if (!first) return null;
    const year = selectedYear.value ?? first.year;
    return harvestData.value.find((s) => s.year === year) ?? first;
});

watch(
    harvestData,
    (seasons) => {
        const first = seasons[0];
        if (first && selectedYear.value === null) selectedYear.value = first.year;
    },
    { immediate: true },
);

function fmt(kg: number): string {
    return kg % 1 === 0 ? `${String(kg)} кг` : `${kg.toFixed(1)} кг`;
}

// ── Лечение ────────────────────────────────────────────────────────────────

type TreatmentRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    product: string;
    dose: string;
    withdrawalDays: number | null;
    withdrawalEnd: Date | null;
    daysLeft: number | null;
};

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const { data: treatmentData, loading: treatmentLoading } = useLiveQuery<TreatmentRow[]>(async () => {
    const events = await db.event
        .where("type")
        .equals("treatment")
        .filter((e) => !e.deletedAt)
        .toArray();

    if (events.length === 0) return [];

    const colonyIds = [...new Set(events.map((e) => e.colonyId).filter((id): id is string => !!id))];
    const coloniesArr = await db.colony.bulkGet(colonyIds);
    const colonyMap: Record<string, LocalColony> = {};
    for (const c of coloniesArr) {
        if (c) colonyMap[c.id] = c;
    }

    return events
        .map((e) => {
            const withdrawalDays = typeof e.payload.withdrawalDays === "number" ? e.payload.withdrawalDays : null;
            let withdrawalEnd: Date | null = null;
            let daysLeft: number | null = null;
            if (withdrawalDays !== null) {
                const end = new Date(e.occurredAt);
                end.setDate(end.getDate() + withdrawalDays);
                end.setHours(0, 0, 0, 0);
                withdrawalEnd = end;
                daysLeft = Math.ceil((end.getTime() - TODAY.getTime()) / 86400000);
                if (daysLeft < 0) daysLeft = 0;
            }
            return {
                event: e,
                colony: e.colonyId ? colonyMap[e.colonyId] : undefined,
                product: typeof e.payload.product === "string" ? e.payload.product : "—",
                dose: typeof e.payload.dose === "string" ? e.payload.dose : "",
                withdrawalDays,
                withdrawalEnd,
                daysLeft,
            };
        })
        .sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());
}, []);

const activeWithdrawals = computed(() => treatmentData.value.filter((r) => r.daysLeft !== null && r.daysLeft > 0));

function fmtDate(d: Date): string {
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function fmtDateFull(d: Date): string {
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

const FEED_TYPES: Record<string, string> = {
    syrup: "Сироп",
    candy: "Канди",
    honey: "Мёд",
    pollen_substitute: "Перговый заменитель",
    water: "Вода",
};

type FeedingRow = {
    event: LocalEvent;
    colony: LocalColony | undefined;
    feedType: string;
    amountKg: number | null;
    concentration: string;
};

const { data: feedingData, loading: feedingLoading } = useLiveQuery<FeedingRow[]>(async () => {
    const events = await db.event
        .where("type")
        .equals("feeding")
        .filter((e) => !e.deletedAt)
        .toArray();

    if (events.length === 0) return [];

    const colonyIds = [...new Set(events.map((e) => e.colonyId).filter((id): id is string => !!id))];
    const coloniesArr = await db.colony.bulkGet(colonyIds);
    const colonyMap: Record<string, LocalColony> = {};
    for (const c of coloniesArr) {
        if (c) colonyMap[c.id] = c;
    }

    return events
        .map((e) => ({
            event: e,
            colony: e.colonyId ? colonyMap[e.colonyId] : undefined,
            feedType: typeof e.payload.feedType === "string" ? e.payload.feedType : "—",
            amountKg: typeof e.payload.amountKg === "number" ? e.payload.amountKg : null,
            concentration: typeof e.payload.concentration === "string" ? e.payload.concentration : "",
        }))
        .sort((a, b) => b.event.occurredAt.getTime() - a.event.occurredAt.getTime());
}, []);
type SurvivalYear = {
    year: number;
    total: number;
    lost: number;
    rate: number;
    colonies: { label: string; diedAt: Date | null }[];
};

const { data: survivalData, loading: survivalLoading } = useLiveQuery<{
    years: SurvivalYear[];
    activeCount: number;
    deadCount: number;
}>(
    async () => {
        const [allColonies, deathEvents] = await Promise.all([
            db.colony.toArray(),
            db.event
                .where("type")
                .equals("death")
                .filter((e) => !e.deletedAt)
                .toArray(),
        ]);

        const deathByColony = new Map<string, Date>();
        for (const e of deathEvents) {
            if (e.colonyId) deathByColony.set(e.colonyId, e.occurredAt);
        }

        const activeCount = allColonies.filter((c) => c.status === "active").length;
        const deadColonies = allColonies.filter((c) => c.status === "dead");

        const byYear = new Map<number, { label: string; diedAt: Date | null }[]>();
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
    },
    { years: [], activeCount: 0, deadCount: 0 },
);
</script>

<template>
    <AppPage
        title="Аналитика"
        variant="stack">
        <div class="section-tabs">
            <button
                type="button"
                class="section-tab"
                :class="{ 'section-tab--active': tab === 'harvest' }"
                @click="tab = 'harvest'">
                <Icon
                    name="lucide:flask-conical"
                    size="14" />
                Откачки
            </button>
            <button
                type="button"
                class="section-tab"
                :class="{ 'section-tab--active': tab === 'treatment' }"
                @click="tab = 'treatment'">
                <Icon
                    name="lucide:pill"
                    size="14" />
                Лечение
                <span
                    v-if="activeWithdrawals.length > 0"
                    class="section-tab__badge">
                    {{ activeWithdrawals.length }}
                </span>
            </button>
            <button
                type="button"
                class="section-tab"
                :class="{ 'section-tab--active': tab === 'feeding' }"
                @click="tab = 'feeding'">
                <Icon
                    name="lucide:droplets"
                    size="14" />
                Подкормки
            </button>
            <button
                type="button"
                class="section-tab"
                :class="{ 'section-tab--active': tab === 'survival' }"
                @click="tab = 'survival'">
                <Icon
                    name="lucide:heart-pulse"
                    size="14" />
                Отход
            </button>
        </div>

        <template v-if="tab === 'harvest'">
            <LoadingSpinner v-if="harvestLoading" />
            <template v-else-if="harvestData.length > 0">
                <div
                    v-if="harvestData.length > 1"
                    class="season-tabs">
                    <button
                        v-for="s in harvestData"
                        :key="s.year"
                        type="button"
                        class="season-tab"
                        :class="{ 'season-tab--active': s.year === currentSeason?.year }"
                        @click="selectedYear = s.year">
                        {{ s.year }}
                    </button>
                </div>

                <template v-if="currentSeason">
                    <div class="totals">
                        <div
                            v-for="(kg, product) in currentSeason.totalByProduct"
                            :key="product"
                            class="total-card">
                            <span class="total-card__label">{{ PRODUCTS[product] ?? product }}</span>
                            <span class="total-card__value">{{ fmt(kg) }}</span>
                        </div>
                    </div>

                    <section class="event-list">
                        <div
                            v-for="row in currentSeason.rows"
                            :key="row.event.id"
                            class="event-row">
                            <div class="event-row__main">
                                <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                                <span class="event-row__value">{{ fmt(row.amountKg) }}</span>
                            </div>
                            <div class="event-row__meta">
                                <span>{{ PRODUCTS[row.product] ?? row.product }}</span>
                                <span>{{ fmtDate(row.event.occurredAt) }}</span>
                            </div>
                        </div>
                    </section>
                </template>
            </template>
            <EmptyState
                v-else
                icon="lucide:flask-conical"
                text="Нет откачек"
                hint="Добавьте событие «Откачка» на странице семьи" />
        </template>

        <template v-else-if="tab === 'treatment'">
            <LoadingSpinner v-if="treatmentLoading" />
            <template v-if="activeWithdrawals.length > 0">
                <div class="withdraw-banner">
                    <Icon
                        name="lucide:alert-triangle"
                        size="16"
                        class="withdraw-banner__icon" />
                    <span>Активные периоды ожидания — откачка мёда запрещена</span>
                </div>
                <section class="event-list">
                    <div
                        v-for="row in activeWithdrawals"
                        :key="row.event.id"
                        class="event-row event-row--warning">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__badge event-row__badge--danger"> ещё {{ row.daysLeft }} дн. </span>
                        </div>
                        <div class="event-row__meta">
                            <span>{{ row.product }}</span>
                            <span>до {{ row.withdrawalEnd ? fmtDateFull(row.withdrawalEnd) : "" }}</span>
                        </div>
                    </div>
                </section>
            </template>

            <template v-if="treatmentData.length > 0">
                <p class="list-header">Журнал обработок</p>
                <section class="event-list">
                    <div
                        v-for="row in treatmentData"
                        :key="row.event.id"
                        class="event-row">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__date">{{ fmtDate(row.event.occurredAt) }}</span>
                        </div>
                        <div class="event-row__meta">
                            <span>{{ row.product }}{{ row.dose ? ` · ${row.dose}` : "" }}</span>
                            <span
                                v-if="row.withdrawalDays !== null"
                                class="event-row__badge"
                                :class="
                                    row.daysLeft && row.daysLeft > 0
                                        ? 'event-row__badge--danger'
                                        : 'event-row__badge--ok'
                                ">
                                {{ row.daysLeft && row.daysLeft > 0 ? `КМО ${String(row.daysLeft)} дн.` : "КМО истёк" }}
                            </span>
                        </div>
                    </div>
                </section>
            </template>

            <EmptyState
                v-else-if="treatmentData.length === 0 && !treatmentLoading"
                icon="lucide:pill"
                text="Нет обработок"
                hint="Добавьте событие «Обработка» на странице семьи" />
        </template>

        <template v-else-if="tab === 'feeding'">
            <LoadingSpinner v-if="feedingLoading" />
            <template v-else-if="feedingData.length > 0">
                <section class="event-list">
                    <div
                        v-for="row in feedingData"
                        :key="row.event.id"
                        class="event-row">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__date">{{ fmtDate(row.event.occurredAt) }}</span>
                        </div>
                        <div class="event-row__meta">
                            <span>
                                {{ FEED_TYPES[row.feedType] ?? row.feedType
                                }}{{ row.concentration ? ` · ${row.concentration}` : "" }}
                            </span>
                            <span v-if="row.amountKg !== null">{{ fmt(row.amountKg) }}</span>
                        </div>
                    </div>
                </section>
            </template>
            <EmptyState
                v-else
                icon="lucide:droplets"
                text="Нет подкормок"
                hint="Добавьте событие «Подкормка» на странице семьи" />
        </template>
        <template v-else-if="tab === 'survival'">
            <LoadingSpinner v-if="survivalLoading" />
            <template v-else>
            <div class="totals">
                <div class="total-card">
                    <span class="total-card__label">Активных</span>
                    <span class="total-card__value">{{ survivalData.activeCount }}</span>
                </div>
                <div class="total-card">
                    <span class="total-card__label">Погибших</span>
                    <span class="total-card__value total-card__value--danger">{{ survivalData.deadCount }}</span>
                </div>
            </div>

            <template v-if="survivalData.years.length > 0">
                <div
                    v-for="yr in survivalData.years"
                    :key="yr.year"
                    class="survival-year">
                    <div class="survival-year__header">
                        <span class="survival-year__title">{{ yr.year }}</span>
                        <span
                            class="survival-year__rate"
                            :class="yr.rate >= 80 ? 'survival-year__rate--ok' : 'survival-year__rate--warn'">
                            {{ yr.rate }}% выживаемость
                        </span>
                    </div>
                    <div class="survival-year__bar">
                        <div
                            class="survival-year__bar-fill"
                            :style="{ width: `${yr.rate}%` }"
                            :class="yr.rate >= 80 ? 'survival-year__bar-fill--ok' : 'survival-year__bar-fill--warn'" />
                    </div>
                    <section class="event-list">
                        <div
                            v-for="c in yr.colonies"
                            :key="c.label"
                            class="event-row">
                            <div class="event-row__main">
                                <span class="event-row__colony">{{ c.label }}</span>
                                <span class="event-row__date">{{ c.diedAt ? fmtDate(c.diedAt) : "" }}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </template>
            <EmptyState
                v-else
                icon="lucide:heart-pulse"
                text="Нет данных об отходе"
                hint="Погибшие семьи появятся здесь после события «Гибель»" />
            </template>
        </template>
    </AppPage>
</template>

<style scoped lang="scss">
.section-tabs {
    display: flex;
    gap: var(--space-2);
}

.section-tab {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition:
        color var(--transition-fast),
        border-color var(--transition-fast),
        background-color var(--transition-fast);
    position: relative;

    &--active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-on-primary);
    }

    &__badge {
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        background: var(--color-danger);
        color: #fff;
        border-radius: var(--radius-full);
        font-size: 11px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }
}

.season-tabs {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
}

.season-tab {
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition:
        color var(--transition-fast),
        border-color var(--transition-fast),
        background-color var(--transition-fast);

    &--active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-on-primary);
    }
}

.totals {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
}

.total-card {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);

    &__label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    &__value {
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--color-primary);
    }
}

.withdraw-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-danger);

    &__icon {
        flex-shrink: 0;
    }
}

.list-header {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.event-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.event-row {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border-radius: var(--radius-md);

    &--warning {
        background: color-mix(in srgb, var(--color-danger) 10%, var(--color-surface));
    }

    &__main {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: var(--space-2);
    }

    &__colony {
        font-size: var(--text-base);
        font-weight: 500;
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__value {
        font-size: var(--text-base);
        font-weight: 700;
        flex-shrink: 0;
    }

    &__date {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    &__meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }

    &__badge {
        font-size: var(--text-xs);
        font-weight: 600;
        padding: 2px var(--space-2);
        border-radius: var(--radius-full);
        flex-shrink: 0;

        &--danger {
            background: color-mix(in srgb, var(--color-danger) 15%, transparent);
            color: var(--color-danger);
        }

        &--ok {
            background: color-mix(in srgb, var(--color-success) 15%, transparent);
            color: var(--color-success);
        }
    }
}

.survival-year {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    &__title {
        font-size: var(--text-base);
        font-weight: 700;
    }

    &__rate {
        font-size: var(--text-sm);
        font-weight: 600;

        &--ok {
            color: var(--color-success);
        }
        &--warn {
            color: var(--color-warning);
        }
    }

    &__bar {
        height: 6px;
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-border) 60%, transparent);
        overflow: hidden;
    }

    &__bar-fill {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width 0.3s ease;

        &--ok {
            background: var(--color-success);
        }
        &--warn {
            background: var(--color-warning);
        }
    }
}

.total-card__value--danger {
    color: var(--color-danger);
}
</style>
