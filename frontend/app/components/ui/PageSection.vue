<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<template>
    <section class="section">
        <h2
            v-if="title"
            class="section__title">
            {{ title }}
        </h2>
        <slot />
    </section>
</template>

<style scoped lang="scss">
.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__title {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
    }
}
</style>
