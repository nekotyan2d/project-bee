<script setup lang="ts">
import { buildFeedingRows } from "~/utils/analytics/feeding";
import { buildHarvestSeasons, type SeasonData } from "~/utils/analytics/harvest";
import { loadEventsWithColonies } from "~/utils/analytics/loadEvents";
import { buildSurvival, EMPTY_SURVIVAL } from "~/utils/analytics/survival";
import { activeWithdrawals as pickActiveWithdrawals, buildTreatmentRows } from "~/utils/analytics/treatment";
import type { FinanceSeason } from "~/utils/finance";

useHead({ title: "Аналитика — Пасека" });

const db = useDb();

type Tab = "harvest" | "treatment" | "feeding" | "survival" | "finance";
const tab = ref<Tab>("harvest");

const productLabel = (p: string): string => capitalize(HARVEST_PRODUCT_LABEL[p] ?? p);
const feedLabel = (t: string): string => capitalize(FEED_TYPE_LABEL[t] ?? t);

const { data: harvestData, loading: harvestLoading } = useLiveQuery<SeasonData[]>(async () => {
    const { events, colonies } = await loadEventsWithColonies("harvest");
    return buildHarvestSeasons(events, colonies);
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

// ── Лечение ────────────────────────────────────────────────────────────────

const { data: treatmentData, loading: treatmentLoading } = useLiveQuery(async () => {
    const { events, colonies } = await loadEventsWithColonies("treatment");
    return buildTreatmentRows(events, colonies);
}, []);

const activeWithdrawals = computed(() => pickActiveWithdrawals(treatmentData.value));

const { data: feedingData, loading: feedingLoading } = useLiveQuery(async () => {
    const { events, colonies } = await loadEventsWithColonies("feeding");
    return buildFeedingRows(events, colonies);
}, []);

const { data: survivalData, loading: survivalLoading } = useLiveQuery(async () => {
    const [colonies, deathEvents] = await Promise.all([
        db.colony.toArray(),
        db.event
            .where("type")
            .equals("death")
            .filter((e) => !e.deletedAt)
            .toArray(),
    ]);
    return buildSurvival(colonies, deathEvents);
}, EMPTY_SURVIVAL);

const { data: financeData, loading: financeLoading } = useLiveQuery<FinanceSeason[]>(
    async () =>
        summarizeFinance(
            await db.event
                .where("type")
                .equals("finance")
                .filter((e) => !e.deletedAt)
                .toArray(),
        ),
    [],
);

const financeYear = ref<number | null>(null);

const financeSeason = computed<FinanceSeason | null>(() => {
    const first = financeData.value[0];
    if (!first) return null;
    return financeData.value.find((s) => s.year === financeYear.value) ?? first;
});
</script>

<template>
    <AppPage
        class="analytics"
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
                :class="{ 'section-tab--active': tab === 'finance' }"
                @click="tab = 'finance'">
                <Icon
                    name="lucide:wallet"
                    size="14" />
                Финансы
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
            <div class="section-header">
                <BaseButton
                    variant="ghost"
                    size="sm"
                    to="/events/new?type=harvest">
                    <Icon
                        name="lucide:plus"
                        size="16" />
                    Записать общий сбор
                </BaseButton>
            </div>
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
                            <span class="total-card__label">{{ productLabel(product) }}</span>
                            <span class="total-card__value">{{ formatAmount(kg, harvestUnit(product)) }}</span>
                        </div>
                        <div
                            v-for="(frames, product) in currentSeason.framesByProduct"
                            :key="`frames-${product}`"
                            class="total-card">
                            <span class="total-card__label">{{ productLabel(product) }}, рамок</span>
                            <span class="total-card__value">{{ frames }}</span>
                        </div>
                    </div>

                    <section class="event-list">
                        <NuxtLink
                            v-for="row in currentSeason.rows"
                            :key="row.event.id"
                            class="event-row"
                            :to="`/events/${row.event.id}`">
                            <div class="event-row__main">
                                <span class="event-row__colony">{{ row.colony?.label ?? "Вся пасека" }}</span>
                                <span class="event-row__value">
                                    {{
                                        [
                                            row.amountKg !== null ? formatAmount(row.amountKg, harvestUnit(row.product)) : null,
                                            row.framesCount !== null ? `${row.framesCount} рам.` : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")
                                    }}
                                </span>
                            </div>
                            <div class="event-row__meta">
                                <span>{{ productLabel(row.product) }}</span>
                                <span>{{ formatDayMonth(row.event.occurredAt) }}</span>
                            </div>
                        </NuxtLink>
                    </section>
                </template>
            </template>
            <EmptyState
                v-else
                icon="lucide:flask-conical"
                text="Нет откачек"
                hint="Рамки — на странице семьи, итоговый вес партии — кнопкой выше" />
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
                    <NuxtLink
                        v-for="row in activeWithdrawals"
                        :key="row.event.id"
                        class="event-row event-row--warning"
                        :to="`/events/${row.event.id}`">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__badge event-row__badge--danger"> ещё {{ row.daysLeft }} дн. </span>
                        </div>
                        <div class="event-row__meta">
                            <span>{{ row.product }}</span>
                            <span>до {{ row.withdrawalEnd ? formatDayMonthLong(row.withdrawalEnd) : "" }}</span>
                        </div>
                    </NuxtLink>
                </section>
            </template>

            <template v-if="treatmentData.length > 0">
                <p class="list-header">Журнал обработок</p>
                <section class="event-list">
                    <NuxtLink
                        v-for="row in treatmentData"
                        :key="row.event.id"
                        class="event-row"
                        :to="`/events/${row.event.id}`">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__date">{{ formatDayMonth(row.event.occurredAt) }}</span>
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
                    </NuxtLink>
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
                    <NuxtLink
                        v-for="row in feedingData"
                        :key="row.event.id"
                        class="event-row"
                        :to="`/events/${row.event.id}`">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Без семьи" }}</span>
                            <span class="event-row__date">{{ formatDayMonth(row.event.occurredAt) }}</span>
                        </div>
                        <div class="event-row__meta">
                            <span>
                                {{ feedLabel(row.feedType)
                                }}{{ row.concentration ? ` · ${row.concentration}` : "" }}
                            </span>
                            <span v-if="row.amountKg !== null">{{ formatAmount(row.amountKg, "л") }}</span>
                        </div>
                    </NuxtLink>
                </section>
            </template>
            <EmptyState
                v-else
                icon="lucide:droplets"
                text="Нет подкормок"
                hint="Добавьте событие «Подкормка» на странице семьи" />
        </template>
        <template v-else-if="tab === 'finance'">
            <div class="section-header">
                <BaseButton
                    variant="ghost"
                    size="sm"
                    to="/events/new?type=finance">
                    <Icon
                        name="lucide:plus"
                        size="16" />
                    Добавить операцию
                </BaseButton>
            </div>

            <LoadingSpinner v-if="financeLoading" />
            <template v-else-if="financeSeason">
                <div
                    v-if="financeData.length > 1"
                    class="season-tabs">
                    <button
                        v-for="s in financeData"
                        :key="s.year"
                        type="button"
                        class="season-tab"
                        :class="{ 'season-tab--active': s.year === financeSeason.year }"
                        @click="financeYear = s.year">
                        {{ s.year }}
                    </button>
                </div>

                <div class="totals">
                    <div class="total-card">
                        <span class="total-card__label">
                            <Icon
                                class="total-card__icon total-card__icon--ok"
                                name="lucide:trending-up"
                                size="14" />
                            Доход
                        </span>
                        <span class="total-card__value total-card__value--ok">
                            {{ formatMoney(financeSeason.income) }}
                        </span>
                    </div>
                    <div class="total-card">
                        <span class="total-card__label">
                            <Icon
                                class="total-card__icon total-card__icon--danger"
                                name="lucide:trending-down"
                                size="14" />
                            Расход
                        </span>
                        <span class="total-card__value total-card__value--danger">
                            {{ formatMoney(financeSeason.expense) }}
                        </span>
                    </div>
                    <div class="total-card">
                        <span class="total-card__label">
                            <Icon
                                class="total-card__icon"
                                name="lucide:equal"
                                size="14" />
                            Итого
                        </span>
                        <span
                            class="total-card__value"
                            :class="{
                                'total-card__value--danger': financeSeason.income < financeSeason.expense,
                            }">
                            {{ formatMoney(financeSeason.income - financeSeason.expense) }}
                        </span>
                    </div>
                </div>

                <section class="event-list">
                    <div
                        v-for="c in financeSeason.byCategory"
                        :key="`${c.income ? 'i' : 'e'}:${c.category}`"
                        class="event-row">
                        <div class="event-row__main">
                            <span class="event-row__colony">
                                <Icon
                                    class="finance-arrow"
                                    :class="c.income ? 'finance-arrow--in' : 'finance-arrow--out'"
                                    :name="c.income ? 'lucide:trending-up' : 'lucide:trending-down'"
                                    size="14" />
                                {{ FINANCE_CATEGORY_LABEL[c.category] ?? c.category }}
                            </span>
                            <span class="event-row__value">{{ formatMoney(c.sum) }}</span>
                        </div>
                    </div>
                </section>

                <div
                    v-for="month in financeSeason.months"
                    :key="month.key"
                    class="finance-month">
                    <h3 class="finance-month__title">{{ month.label }}</h3>
                    <section class="event-list">
                        <NuxtLink
                            v-for="row in month.rows"
                            :key="row.event.id"
                            class="event-row"
                            :to="`/events/${row.event.id}`">
                            <div class="event-row__main">
                                <span class="event-row__colony">
                                    {{ row.item || FINANCE_CATEGORY_LABEL[row.category] || row.category }}
                                </span>
                                <span
                                    class="event-row__value"
                                    :class="{ 'total-card__value--danger': !row.income }">
                                    {{ row.income ? "+" : "−" }}{{ formatMoney(row.amount) }}
                                </span>
                            </div>
                            <div class="event-row__meta">
                                <span>{{
                                    row.counterparty || (row.income ? "покупатель не указан" : "продавец не указан")
                                }}</span>
                                <span>{{ formatDayMonth(row.event.occurredAt) }}</span>
                            </div>
                        </NuxtLink>
                    </section>
                </div>
            </template>
            <EmptyState
                v-else
                icon="lucide:wallet"
                text="Нет финансовых операций"
                hint="Записывайте покупки и продажи — здесь появится приход, расход и сальдо" />
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
                                :class="
                                    yr.rate >= 80 ? 'survival-year__bar-fill--ok' : 'survival-year__bar-fill--warn'
                                " />
                        </div>
                        <section class="event-list">
                            <div
                                v-for="c in yr.colonies"
                                :key="c.label"
                                class="event-row">
                                <div class="event-row__main">
                                    <span class="event-row__colony">{{ c.label }}</span>
                                    <span class="event-row__date">{{ c.diedAt ? formatDayMonth(c.diedAt) : "" }}</span>
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

<style lang="scss" src="~/assets/scss/analytics.scss" />

<style scoped lang="scss">
.section-tabs {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
}

.section-tab {
    flex-shrink: 0;
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
        background: var(--color-primary-container);
        border-color: var(--color-primary-container);
        color: var(--color-on-primary-container);
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

.finance-month {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__title {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        padding-left: var(--space-1);
    }
}

.finance-arrow {
    vertical-align: -2px;

    &--in {
        color: var(--color-success);
    }
    &--out {
        color: var(--color-danger);
    }
}
</style>
