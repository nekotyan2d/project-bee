<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

const props = defineProps<{
    hive: LocalHive;
    colony?: LocalColony;
    queen?: LocalQueen;
}>();

const status = computed(() => props.colony ? inspectionStatus(props.colony.lastInspectedAt) : null);

const queenLabel = computed(() => {
    if (!props.queen) return null;
    return props.queen.breed ?? (props.queen.year ? `Матка ${String(props.queen.year)}` : "Матка");
});
</script>

<template>
    <NuxtLink
        v-if="colony"
        :to="`/colonies/${colony.id}`"
        class="hive-card"
    >
        <div class="hive-card__top">
            <span class="hive-card__label">{{ hive.label }}</span>
            <span v-if="status" class="attention" :data-level="status.level">
                <Icon name="lucide:search" size="13" />
                {{ status.label }}
            </span>
        </div>

        <div class="hive-card__meta">
            <span v-if="queenLabel" class="hive-card__meta-item">
                <Icon name="lucide:crown" size="14" />
                {{ queenLabel }}
            </span>
            <span v-if="colony.superCount > 0" class="hive-card__meta-item">
                <Icon name="lucide:layers" size="14" />
                {{ colony.superCount }} маг.
            </span>
        </div>
    </NuxtLink>

    <NuxtLink
        v-else
        :to="`/colonies/new?hiveId=${hive.id}`"
        class="hive-card hive-card--empty"
    >
        <div class="hive-card__top">
            <span class="hive-card__label">{{ hive.label }}</span>
            <span class="hive-card__empty-tag">Пусто</span>
        </div>
        <span class="hive-card__settle">
            <Icon name="lucide:plus" size="14" />
            Заселить семью
        </span>
    </NuxtLink>
</template>

<style scoped lang="scss">
.hive-card {
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

    &--empty {
        box-shadow: none;
        border-style: dashed;
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

    &__empty-tag {
        font-size: var(--text-xs);
        font-weight: 600;
        padding: 2px var(--space-2);
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
        color: var(--color-text-muted);
    }

    &__settle {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--color-primary);
    }
}

.attention {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);

    &[data-level="ok"] {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
    }

    &[data-level="warn"] {
        background: color-mix(in srgb, var(--color-warning) 18%, transparent);
        color: var(--color-warning);
    }

    &[data-level="alert"] {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
    }
}
</style>
