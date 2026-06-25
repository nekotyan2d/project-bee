<script setup lang="ts">
const props = defineProps<{
    id?: string;
    type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date" | "datetime-local";
    placeholder?: string;
    autocomplete?: string;
    inputmode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
    min?: number | string;
    max?: number | string;
    step?: number | string;
    required?: boolean;
    disabled?: boolean;
    autofocus?: boolean;
}>();

const model = defineModel<string | number>();

const el = ref<HTMLInputElement | null>(null);
onMounted(() => {
    if (props.autofocus) el.value?.focus();
});
</script>

<template>
    <input
        :id="id"
        ref="el"
        v-model="model"
        class="input"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :min="min"
        :max="max"
        :step="step"
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
