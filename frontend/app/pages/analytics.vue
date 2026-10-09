<script setup lang="ts">
import { loadEventsWithColonies } from "~/utils/analytics/loadEvents";
import { activeWithdrawals as pickActiveWithdrawals, buildTreatmentRows } from "~/utils/analytics/treatment";

useHead({ title: "Аналитика — Пасека" });

type Tab = "harvest" | "treatment" | "feeding" | "survival" | "finance";
const tab = ref<Tab>("harvest");

// ── Лечение ────────────────────────────────────────────────────────────────

const { data: treatmentData, loading: treatmentLoading } = useLiveQuery(async () => {
    const { events, colonies } = await loadEventsWithColonies("treatment");
    return buildTreatmentRows(events, colonies);
}, []);

const activeWithdrawals = computed(() => pickActiveWithdrawals(treatmentData.value));

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

        <HarvestTab v-if="tab === 'harvest'" />
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

        <FeedingTab v-else-if="tab === 'feeding'" />
        <FinanceTab v-else-if="tab === 'finance'" />
        <SurvivalTab v-else-if="tab === 'survival'" />
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
</style>
