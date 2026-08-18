<script setup lang="ts">
withDefaults(
    defineProps<{
        label: string;
        align?: "center" | "start";
    }>(),
    { align: "center" },
);
</script>

<template>
    <div :class="['info-row', `info-row--${align}`]">
        <span class="info-row__label">{{ label }}</span>
        <span class="info-row__value"><slot /></span>
    </div>
</template>

<style scoped lang="scss">
.info-row {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--tap-min);
    padding: var(--space-3) var(--space-4);

    &--center {
        align-items: center;
    }

    &--start {
        align-items: flex-start;
    }

    &__label {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    &__value {
        min-width: 0;
        font-size: var(--text-sm);
        font-weight: 500;
        overflow-wrap: break-word;
    }
}
</style>
