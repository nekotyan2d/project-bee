<template>
    <p class="sheet-title"><slot /></p>
</template>

<style scoped lang="scss">
.sheet-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-muted);
    padding: 0 var(--space-4) var(--space-2);
}
</style>
