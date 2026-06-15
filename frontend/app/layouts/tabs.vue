<template>
    <div class="tabs-layout">
        <slot />
        <BottomBar />
    </div>
</template>

<style scoped lang="scss">
.tabs-layout :deep(.main) {
    padding-bottom: calc(72px + 56px + var(--safe-bottom));
}
</style>