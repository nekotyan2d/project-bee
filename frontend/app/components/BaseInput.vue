<script setup lang="ts">
defineProps<{
    id?: string;
    type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "datetime-local";
    placeholder?: string;
    autocomplete?: string;
    required?: boolean;
    disabled?: boolean;
}>();

const model = defineModel<string>();
</script>

<template>
    <input
        :id="id"
        v-model="model"
        class="input"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
    >
</template>

<style scoped lang="scss">
.input {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    min-height: var(--tap-min);
    transition: border-color var(--transition-fast);

    &::placeholder {
        color: var(--color-text-muted);
    }

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }
}
</style>
