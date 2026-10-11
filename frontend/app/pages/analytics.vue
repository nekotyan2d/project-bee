<script setup lang="ts">
import { loadEventsWithColonies } from "~/utils/analytics/loadEvents";
import { activeWithdrawals as pickActiveWithdrawals, buildTreatmentRows } from "~/utils/analytics/treatment";

useHead({ title: "Аналитика — Пасека" });

type Tab = "harvest" | "treatment" | "feeding" | "survival" | "finance";
const tab = ref<Tab>("harvest");

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
        <TreatmentTab
            v-else-if="tab === 'treatment'"
            :rows="treatmentData"
            :loading="treatmentLoading" />

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
</style>
