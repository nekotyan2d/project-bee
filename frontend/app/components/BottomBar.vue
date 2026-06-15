<script setup lang="ts">
const TABS = [
    { to: "/", icon: "lucide:hexagon", label: "Пасека" },
    { to: "/account", icon: "lucide:user", label: "Аккаунт" },
] as const;

const route = useRoute();
const isActive = (to: string): boolean => (to === "/" ? route.path === "/" : route.path.startsWith(to));
</script>

<template>
    <nav class="bottom-bar">
        <NuxtLink
            v-for="tab in TABS"
            :key="tab.to"
            :to="tab.to"
            class="bottom-bar__tab"
            :class="{ 'bottom-bar__tab--active': isActive(tab.to) }">
            <Icon :name="tab.icon" size="22" />
            <span class="bottom-bar__label">{{ tab.label }}</span>
        </NuxtLink>
    </nav>
</template>

<style scoped lang="scss">
.bottom-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border);
    padding-bottom: var(--safe-bottom);

    &__tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: var(--space-2) 0;
        min-height: 56px;
        color: var(--color-text-muted);
        text-decoration: none;
        transition: color var(--transition-fast);

        &--active {
            color: var(--color-primary);
        }
    }

    &__label {
        font-size: var(--text-xs);
        font-weight: 600;
    }
}
</style>
