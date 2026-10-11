<script setup lang="ts">
defineProps<{
    to: string;
    icon: string;
    label: string;
    hint?: string;
    arrow?: boolean;
}>();

defineEmits<{ click: [] }>();
</script>

<template>
    <NuxtLink
        :to="to"
        class="sheet-item"
        @click="$emit('click')">
        <span class="sheet-item__icon">
            <Icon
                :name="icon"
                size="18" />
        </span>
        <span class="sheet-item__body">
            <span class="sheet-item__label">{{ label }}</span>
            <span
                v-if="hint"
                class="sheet-item__hint">
                {{ hint }}
            </span>
        </span>
        <Icon
            v-if="arrow"
            name="lucide:chevron-right"
            size="16"
            class="sheet-item__arrow" />
    </NuxtLink>
</template>

<style scoped lang="scss">
.sheet-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    color: var(--color-text);
    min-height: var(--tap-min);
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &__icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        flex-shrink: 0;
    }

    &__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 500;
    }

    &__hint {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }
}
</style>
