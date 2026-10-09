<script setup lang="ts">
import { activeWithdrawals as pickActiveWithdrawals, type TreatmentRow } from "~/utils/analytics/treatment";

const props = defineProps<{ rows: TreatmentRow[]; loading: boolean }>();

const activeWithdrawals = computed(() => pickActiveWithdrawals(props.rows));
</script>

<template>
    <LoadingSpinner v-if="loading" />
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

    <template v-if="rows.length > 0">
        <p class="list-header">Журнал обработок</p>
        <section class="event-list">
            <NuxtLink
                v-for="row in rows"
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
                        :class="row.daysLeft && row.daysLeft > 0 ? 'event-row__badge--danger' : 'event-row__badge--ok'">
                        {{ row.daysLeft && row.daysLeft > 0 ? `КМО ${String(row.daysLeft)} дн.` : "КМО истёк" }}
                    </span>
                </div>
            </NuxtLink>
        </section>
    </template>

    <EmptyState
        v-else-if="rows.length === 0 && !loading"
        icon="lucide:pill"
        text="Нет обработок"
        hint="Добавьте событие «Обработка» на странице семьи" />
</template>

<style scoped lang="scss">
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
