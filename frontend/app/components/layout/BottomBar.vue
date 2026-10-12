<script setup lang="ts">
const TABS = [
    { to: "/", icon: "lucide:hexagon", label: "Пасека" },
    { to: "/analytics", icon: "lucide:chart-column-big", label: "Аналитика" },
    { to: "/settings", icon: "lucide:settings", label: "Настройки" },
] as const;

const route = useRoute();
const isActive = (to: string): boolean => (to === "/" ? route.path === "/" : route.path.startsWith(to));
</script>

<template>
    <nav class="bottom-bar">
        <div class="bottom-bar__inner">
            <NuxtLink
                v-for="tab in TABS"
                :key="tab.to"
                :to="tab.to"
                class="bottom-bar__tab"
                :class="{ 'bottom-bar__tab--active': isActive(tab.to) }">
                <span class="bottom-bar__indicator">
                    <Icon
                        :name="tab.icon"
                        size="22" />
                </span>
                <span class="bottom-bar__label">{{ tab.label }}</span>
            </NuxtLink>
        </div>
    </nav>
</template>

<style scoped lang="scss">
.bottom-bar {
    view-transition-name: bottombar;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--color-surface-3);
    padding-bottom: var(--safe-bottom);

    &__inner {
        display: flex;
        max-width: 640px;
        margin: 0 auto;
    }

    &__tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 12px 0 16px;
        min-height: 80px;
        color: var(--color-text-muted);
        text-decoration: none;
        transition: color var(--transition-fast);

        &--active {
            color: var(--color-text);
        }
    }

    &__indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 32px;
        border-radius: var(--radius-full);
        transition: background-color var(--transition-fast);
    }

    &__tab--active &__indicator {
        background: var(--color-secondary-container);
        color: var(--color-on-secondary-container);
    }

    &__label {
        font-size: var(--text-xs);
        font-weight: 600;
    }
}
</style>
