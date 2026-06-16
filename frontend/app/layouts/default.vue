<script setup lang="ts">
const TAB_PATHS = new Set(["/", "/analytics", "/account"]);
const route = useRoute();
const showTabs = computed(() => TAB_PATHS.has(route.path));
</script>

<template>
    <div class="tabs-layout" :class="{ 'tabs-layout--tabs': showTabs }">
        <slot />
        <BottomBar v-if="showTabs" />
    </div>
</template>

<style scoped lang="scss">
.tabs-layout--tabs :deep(.main) {
    padding-bottom: calc(72px + 56px + var(--safe-bottom));
}
</style>