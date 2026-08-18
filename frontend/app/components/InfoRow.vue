<script setup lang="ts">
defineProps<{
    label: string;
}>();
</script>

<template>
    <div class="info-row">
        <span class="info-row__label">{{ label }}</span>
        <span class="info-row__value"><slot /></span>
    </div>
</template>

<style scoped lang="scss">
.info-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: var(--tap-min);
    padding: var(--space-2) var(--space-4);

    &__label {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    &__value {
        flex: 1;
        min-width: 0;
        font-size: var(--text-sm);
        font-weight: 500;
        text-align: right;
        overflow-wrap: break-word;
    }
}
</style>
