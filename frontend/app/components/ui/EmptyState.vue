<script setup lang="ts">
defineProps<{
    icon: string;
    text: string;
    hint?: string;
}>();
</script>

<template>
    <div class="empty">
        <Icon :name="icon" size="48" class="empty__icon" />
        <p class="empty__text">{{ text }}</p>
        <p v-if="hint" class="empty__hint">{{ hint }}</p>
    </div>
</template>

<style scoped lang="scss">
.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: var(--space-10) var(--space-4);
    text-align: center;

    &__icon {
        color: var(--color-text-muted);
        opacity: 0.4;
    }

    &__text {
        font-size: var(--text-lg);
        font-weight: 600;
    }

    &__hint {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}
</style>
