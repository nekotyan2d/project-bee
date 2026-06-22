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
            <BaseButton
                v-if="backTo"
                variant="ghost"
                size="icon"
                class="topbar__back"
                aria-label="Назад"
                @click="goBack">
                <Icon
                    name="lucide:arrow-left"
                    size="20" />
            </BaseButton>
            <h1 class="topbar__title">
                <Icon
                    v-if="icon"
                    :name="icon"
                    size="20" />
                {{ title }}
            </h1>
            <div
                v-if="$slots.actions"
                class="topbar__actions">
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
    height: var(--topbar-height);

    &__inner {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        max-width: 640px;
        margin: 0 auto;
        padding: var(--space-3) var(--space-4);
    }

    &__back {
        margin: 0 calc(-1 * var(--space-2));
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
