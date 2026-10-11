<script setup lang="ts">
import type { LocalColony, LocalQueen } from "~/shared/db";

const props = defineProps<{
    colony: LocalColony;
    queen?: LocalQueen;
}>();

const plural = new Intl.PluralRules("ru");
const SUPERS_WORD: Record<string, string> = { one: "магазин", few: "магазина" };
const supersWord = computed(() => SUPERS_WORD[plural.select(props.colony.superCount)] ?? "магазинов");
</script>

<template>
    <NuxtLink
        :to="`/colonies/${colony.id}`"
        class="colony-link">
        <div class="colony-link__top">
            <span class="colony-link__label">{{ colony.label }}</span>
            <Icon
                name="lucide:chevron-right"
                size="18"
                class="colony-link__arrow" />
        </div>
        <div class="colony-link__meta">
            <span
                v-if="colony.lastInspectedAt"
                class="colony-link__meta-item">
                <Icon
                    name="lucide:search"
                    size="14" />
                {{ daysAgo(colony.lastInspectedAt) }}
            </span>
            <span
                v-if="colony.superCount > 0"
                class="colony-link__meta-item">
                <Icon
                    name="lucide:layers"
                    size="14" />
                {{ colony.superCount }}
                {{ supersWord }}
            </span>
            <span
                v-if="queen"
                class="colony-link__meta-item">
                <Icon
                    name="lucide:crown"
                    size="14" />
                {{ queen.year ? `Матка ${String(queen.year)}` : "Матка" }}
            </span>
        </div>
    </NuxtLink>
</template>

<style scoped lang="scss">
.colony-link {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
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
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 600;
    }

    &__arrow {
        color: var(--color-text-muted);
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
