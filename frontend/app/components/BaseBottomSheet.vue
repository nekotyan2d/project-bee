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
                <div class="sheet__handle" />
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
    background: var(--color-surface);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: var(--space-2) 0 max(var(--space-6), env(safe-area-inset-bottom));
    max-height: 80dvh;
    overflow-y: auto;
}

.sheet__handle {
    width: 36px;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-border);
    margin: var(--space-1) auto var(--space-4);
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
