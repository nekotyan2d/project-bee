<script setup lang="ts">
defineProps<{ text: string }>();
</script>

<template>
    <div class="not-found">
        <p>{{ text }}</p>
        <NuxtLink to="/">На главную</NuxtLink>
    </div>
</template>

<style scoped lang="scss">
.not-found {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--color-text-muted);
}
</style>
