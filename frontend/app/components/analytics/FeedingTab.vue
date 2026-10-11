<script setup lang="ts">
import { buildFeedingRows } from "~/utils/analytics/feeding";
import { loadEventsWithColonies } from "~/utils/analytics/loadEvents";

const feedLabel = (t: string): string => capitalize(FEED_TYPE_LABEL[t] ?? t);

const { data: rows, loading } = useLiveQuery(async () => {
    const { events, colonies } = await loadEventsWithColonies("feeding");
    return buildFeedingRows(events, colonies);
}, []);
</script>

<template>
    <LoadingSpinner v-if="loading" />
    <section
        v-else-if="rows.length > 0"
        class="event-list">
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
                <span>{{ feedLabel(row.feedType) }}{{ row.concentration ? ` · ${row.concentration}` : "" }}</span>
                <span v-if="row.amountKg !== null">{{ formatAmount(row.amountKg, "л") }}</span>
            </div>
        </NuxtLink>
    </section>
    <EmptyState
        v-else
        icon="lucide:droplets"
        text="Нет подкормок"
        hint="Добавьте событие «Подкормка» на странице семьи" />
</template>
