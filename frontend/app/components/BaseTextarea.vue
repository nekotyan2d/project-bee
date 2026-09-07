<script setup lang="ts">
defineProps<{
    id?: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
}>();

const model = defineModel<string | number>();
</script>

<template>
    <textarea
        :id="id"
        v-model="model"
        class="textarea"
        :placeholder="placeholder"
        :required="required"
        :rows="rows ?? 4"
    />
</template>

<style scoped lang="scss">
.textarea {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    resize: vertical;
    transition: border-color var(--transition-fast);
    line-height: 1.5;

    &::placeholder {
        color: var(--color-text-muted);
    }

    &:focus {
        outline: none;
        border-color: var(--color-primary);
    }
}
</style>
