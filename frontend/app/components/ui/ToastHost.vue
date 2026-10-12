<script setup lang="ts">
const { message } = useToast();
</script>

<template>
    <Transition name="toast">
        <div
            v-if="message"
            class="toast"
            role="status"
            aria-live="polite">
            {{ message }}
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.toast {
    view-transition-name: toast;
    position: fixed;
    left: 50%;
    bottom: calc(var(--bottombar-height) + var(--safe-bottom) + var(--space-3));
    transform: translateX(-50%);
    max-width: min(calc(100vw - 2 * var(--space-4)), 480px);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    background: var(--color-text);
    color: var(--color-surface);
    font-size: var(--text-sm);
    font-weight: 500;
    box-shadow: var(--shadow-md);
    z-index: 60;
    pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
    transition:
        opacity var(--motion-normal),
        transform var(--motion-normal);
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
}
</style>
