<script setup lang="ts">
import type { LocalColony, LocalEvent, LocalHive } from "~/shared/db";
import { nestLabel } from "~/utils/colonyNest";

const props = defineProps<{
    colony: LocalColony;
    hive?: LocalHive;
    events: LocalEvent[];
}>();

const nest = computed(() => nestLabel(props.events, props.hive?.frameCount));
</script>

<template>
    <div class="metrics">
        <NuxtLink
            :to="`/events/new/?colonyId=${colony.id}&type=inspection`"
            class="metric">
            <Icon
                name="lucide:search"
                size="20"
                class="metric__icon" />
            <span class="metric__value">{{ daysAgo(colony.lastInspectedAt) ?? "Не осматривалась" }}</span>
            <span class="metric__label">Последний осмотр</span>
        </NuxtLink>
        <NuxtLink
            class="metric"
            :to="`/events/new/?colonyId=${colony.id}&type=super_change`">
            <Icon
                name="lucide:layers"
                size="20"
                class="metric__icon" />
            <span class="metric__value">{{ colony.superCount }}</span>
            <span class="metric__label">Магазинов</span>
        </NuxtLink>
        <NuxtLink
            class="metric"
            :to="`/events/new/?colonyId=${colony.id}&type=inspection`">
            <Icon
                name="lucide:layout-list"
                size="20"
                class="metric__icon" />
            <span class="metric__value">{{ nest }}</span>
            <span class="metric__label">Гнездо</span>
        </NuxtLink>
    </div>
</template>

<style scoped lang="scss">
.metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
}

.metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    text-align: center;

    &__icon {
        color: var(--color-primary);
    }

    &__value {
        font-size: var(--text-base);
        font-weight: 700;
    }

    &__label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
    }
}
</style>
