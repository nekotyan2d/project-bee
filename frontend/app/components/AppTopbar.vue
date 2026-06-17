<script setup lang="ts">
const props = defineProps<{
    title: string;
    icon?: string;
    backTo?: string;
}>();

const router = useRouter();

function goBack(): void {
    const state = window.history.state as { back?: string } | null;
    if (state?.back) router.back();
    else if (props.backTo) void router.push(props.backTo);
}
</script>

<template>
    <header class="topbar">
        <div class="topbar__inner">
            <button v-if="backTo" type="button" class="topbar__back" aria-label="Назад" @click="goBack">
                <Icon name="lucide:arrow-left" size="20" />
            </button>
            <h1 class="topbar__title">
                <Icon v-if="icon" :name="icon" size="20" />
                {{ title }}
            </h1>
            <div v-if="$slots.actions" class="topbar__actions">
                <slot name="actions" />
            </div>
        </div>
    </header>
</template>

<style scoped lang="scss">
.topbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    padding-top: var(--safe-top);

    &__inner {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        max-width: 640px;
        margin: 0 auto;
        padding: var(--space-3) var(--space-4);
    }

    &__back {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: var(--tap-min);
        min-height: var(--tap-min);
        margin: 0 calc(-1 * var(--space-2));
        color: var(--color-text);
        border: none;
        background: none;
        cursor: pointer;
    }

    &__title {
        flex: 1;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-lg);
        font-weight: 700;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        margin-left: auto;
    }
}
</style>
