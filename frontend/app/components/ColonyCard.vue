<script setup lang="ts">
import type { LocalColony, LocalHive } from "~/shared/db";

const props = defineProps<{
    colony: LocalColony;
    hive?: LocalHive;
}>();

const STATUS_LABEL: Record<string, string> = {
    active: "Активна",
    dead: "Погибла",
    merged: "Объединена",
    split: "Разделена",
};

const lastInspected = computed(() => daysAgo(props.colony.lastInspectedAt));
</script>

<template>
    <NuxtLink :to="`/colonies/${colony.id}`" class="colony-card">
        <div class="colony-card__top">
            <span class="colony-card__label">{{ colony.label }}</span>
            <span class="colony-card__status" :data-status="colony.status">
                {{ STATUS_LABEL[colony.status] ?? colony.status }}
            </span>
        </div>

        <div class="colony-card__meta">
            <span v-if="hive" class="colony-card__meta-item">
                <Icon name="lucide:box" size="14" />
                {{ hive.label }}
            </span>
            <span v-if="lastInspected" class="colony-card__meta-item">
                <Icon name="lucide:search" size="14" />
                {{ lastInspected }}
            </span>
            <span v-if="colony.superCount > 0" class="colony-card__meta-item">
                <Icon name="lucide:layers" size="14" />
                {{ colony.superCount }} {{ colony.superCount === 1 ? "магазин" : "магазина" }}
            </span>
        </div>
    </NuxtLink>
</template>

<style scoped lang="scss">
.colony-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: inherit;
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 600;
    }

    &__status {
        font-size: var(--text-xs);
        font-weight: 600;
        padding: 2px var(--space-2);
        border-radius: var(--radius-full);

        &[data-status="active"] {
            background: color-mix(in srgb, var(--color-success) 15%, transparent);
            color: var(--color-success);
        }

        &[data-status="dead"] {
            background: color-mix(in srgb, var(--color-danger) 15%, transparent);
            color: var(--color-danger);
        }

        &[data-status="merged"],
        &[data-status="split"] {
            background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
            color: var(--color-text-muted);
        }
    }

    &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
    }

    &__meta-item {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}
</style>
