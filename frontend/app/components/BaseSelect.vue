<script setup lang="ts">
defineProps<{
    id?: string;
    required?: boolean;
}>();

const model = defineModel<string>();
</script>

<template>
    <div class="select-wrap">
        <select :id="id" v-model="model" class="select" :required="required">
            <slot />
        </select>
        <Icon name="lucide:chevron-down" size="16" class="select-arrow" />
    </div>
</template>

<style scoped lang="scss">
.select-wrap {
    position: relative;
}

.select {
    width: 100%;
    padding: var(--space-3) var(--space-8) var(--space-3) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    min-height: var(--tap-min);
    appearance: none;
    transition: border-color var(--transition-fast);

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }
}

.select-arrow {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--color-text-muted);
}
</style>
