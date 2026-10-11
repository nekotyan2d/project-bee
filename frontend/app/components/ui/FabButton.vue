<script setup lang="ts">
defineProps<{
    label: string;
    aboveBottomBar?: boolean;
}>();

defineEmits<{ click: [] }>();
</script>

<template>
    <button
        type="button"
        class="fab"
        :class="{ 'fab--above-bar': aboveBottomBar }"
        :aria-label="label"
        @click="$emit('click')">
        <Icon
            name="lucide:plus"
            size="24" />
    </button>
</template>

<style scoped lang="scss">
.fab {
    position: fixed;
    bottom: calc(var(--space-5) + var(--safe-bottom));
    right: var(--space-5);
    width: 56px;
    height: 56px;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: background-color var(--transition-fast);
    cursor: pointer;
    z-index: 10;

    &--above-bar {
        bottom: calc(var(--space-3) + var(--bottombar-height) + var(--safe-bottom));
    }

    &:active {
        background: color-mix(in srgb, var(--color-primary-container) 88%, var(--color-on-primary-container) 12%);
    }
}
</style>
