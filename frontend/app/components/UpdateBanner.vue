<script setup lang="ts">
const pwa = usePWA();
</script>

<template>
    <div
        v-if="pwa?.needRefresh"
        class="update-banner">
        <div class="update-banner__inner">
            <span>Доступно обновление приложения</span>
            <button
                type="button"
                class="update-banner__btn"
                @click="pwa.updateServiceWorker()">
                Обновить
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.update-banner {
    position: sticky;
    top: var(--topbar-height);
    z-index: 9;
    background: var(--color-primary);
    color: var(--color-on-primary);

    &__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        max-width: 640px;
        margin: 0 auto;
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-sm);
        font-weight: 600;
    }

    &__btn {
        flex-shrink: 0;
        padding: var(--space-1) var(--space-3);
        background: var(--color-on-primary);
        color: var(--color-primary);
        border: none;
        border-radius: var(--radius-full);
        font-size: var(--text-sm);
        font-weight: 700;
        cursor: pointer;
        min-height: var(--tap-min);
    }
}
</style>
