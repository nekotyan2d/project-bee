<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 });
</script>

<template>
    <div
        class="loading-spinner"
        role="status"
        aria-label="Загрузка"
        :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<style scoped lang="scss">
.loading-spinner {
    margin: var(--space-8) auto;
    border: 3px solid transparent;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
