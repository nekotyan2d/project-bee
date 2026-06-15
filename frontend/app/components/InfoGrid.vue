<script setup lang="ts"></script>

<template>
    <div class="info-grid">
        <slot />
    </div>
</template>

<style scoped lang="scss">
.info-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;
}
</style>
