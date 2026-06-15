<script setup lang="ts">
withDefaults(
    defineProps<{
        variant?: "primary" | "secondary" | "ghost" | "danger";
        size?: "sm" | "md" | "lg";
        type?: "button" | "submit" | "reset";
        block?: boolean;
        disabled?: boolean;
        loading?: boolean;
    }>(),
    {
        variant: "primary",
        size: "md",
        type: "button",
        block: false,
        disabled: false,
        loading: false,
    },
);
</script>

<template>
    <button
        :type="type"
        :disabled="disabled || loading"
        :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--block': block }]"
    >
        <span v-if="loading" class="btn__spinner" aria-hidden="true" />
        <slot />
    </button>
</template>

<style scoped lang="scss">
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    line-height: 1;
    transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        opacity var(--transition-fast);

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    &--block {
        width: 100%;
    }

    &--sm {
        min-height: 36px;
        padding: 0 var(--space-3);
        font-size: var(--text-sm);
    }

    &--lg {
        min-height: 52px;
        padding: 0 var(--space-6);
        font-size: var(--text-lg);
    }

    &--primary {
        background: var(--color-primary);
        color: var(--color-on-primary);

        &:hover:not(:disabled) {
            background: var(--color-primary-hover);
        }
    }

    &--secondary {
        border-color: var(--color-border);
        background: var(--color-surface);
        color: var(--color-text);

        &:hover:not(:disabled) {
            background: var(--color-surface-2);
        }
    }

    &--ghost {
        background: transparent;
        color: var(--color-text);

        &:hover:not(:disabled) {
            background: var(--color-surface-2);
        }
    }

    &--danger {
        background: var(--color-danger);
        color: var(--color-on-danger);

        &:hover:not(:disabled) {
            background: var(--color-danger-hover);
        }
    }

    &__spinner {
        width: 1em;
        height: 1em;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: var(--radius-full);
        animation: btn-spin 0.6s linear infinite;
    }
}

@keyframes btn-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
