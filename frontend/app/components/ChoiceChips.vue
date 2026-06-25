<script setup lang="ts">
defineProps<{
    options: { value: string; label: string }[];
}>();

const model = defineModel<string>();
</script>

<template>
    <div
        class="chips"
        role="group">
        <button
            v-for="o in options"
            :key="o.value"
            type="button"
            class="chip"
            :class="{ 'chip--active': model === o.value }"
            @click="model = o.value">
            {{ o.label }}
        </button>
    </div>
</template>

<style scoped lang="scss">
.chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.chip {
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border: 1px solid var(--color-outline);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--color-text);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    font-weight: 500;
    cursor: pointer;
    transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        color var(--transition-fast);

    &--active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-on-primary);
    }
}
</style>
