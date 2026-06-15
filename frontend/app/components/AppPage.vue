<script setup lang="ts">
defineProps<{
    title: string;
    backTo?: string;
    icon?: string;
    variant?: "form" | "stack" | "list";
}>();
</script>

<template>
    <div class="layout">
        <AppTopbar :title="title" :icon="icon" :back-to="backTo">
            <template v-if="$slots.actions" #actions>
                <slot name="actions" />
            </template>
        </AppTopbar>

        <main class="main" :class="`main--${variant ?? 'form'}`">
            <slot />
        </main>

        <slot name="overlay" />
    </div>
</template>

<style scoped lang="scss">
.layout {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
}

.main {
    flex: 1;
    max-width: 640px;
    width: 100%;
    margin: 0 auto;

    &--form {
        padding: var(--space-5) var(--space-4) var(--space-8);
    }

    &--stack {
        padding: var(--space-4) var(--space-4) var(--space-8);
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
    }

    &--list {
        padding: var(--space-4) var(--space-4) calc(var(--space-4) + 72px + var(--safe-bottom));
    }
}
</style>
