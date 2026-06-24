<script setup lang="ts">
const modelValue = defineModel<boolean>({ default: false });

watch(modelValue, (open) => {
    if (import.meta.client) {
        document.body.style.overflow = open ? "hidden" : "";
    }
});
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="modelValue" class="backdrop" @click="modelValue = false" />
        </Transition>
        <Transition name="slide-up">
            <div v-if="modelValue" class="sheet" role="dialog" aria-modal="true">
                <div class="sheet__handle-area">
                    <div class="sheet__handle" />
                </div>
                <slot />
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped lang="scss">
.backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 40;
}

.sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    max-width: 640px;
    margin: 0 auto;
    background: var(--color-surface);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: 0 0 max(var(--space-6), env(safe-area-inset-bottom));
    max-height: calc(100dvh - 72px);
    overflow-y: auto;

    @media (width > 640px) {
        max-height: calc(100dvh - 56px);
    }
}

.sheet__handle-area {
    display: flex;
    justify-content: center;
    padding: 22px 0;
}

.sheet__handle {
    width: 32px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-border);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
}
</style>
