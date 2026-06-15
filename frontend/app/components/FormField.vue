<script setup lang="ts">
defineProps<{
    label: string;
    required?: boolean;
}>();

const fieldId = useId();
</script>

<template>
    <div class="field">
        <label class="field__label" :for="fieldId">
            {{ label }}<span v-if="required" class="field__required"> *</span>
        </label>
        <slot :id="fieldId" />
    </div>
</template>

<style scoped lang="scss">
.field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__label {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text);
    }

    &__required {
        color: var(--color-danger);
    }
}
</style>
