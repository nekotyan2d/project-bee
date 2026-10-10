<script setup lang="ts">
defineProps<{
    error?: string | null;
    submitting?: boolean;
    submitLabel?: string;
}>();

defineEmits<{ submit: [] }>();
</script>

<template>
    <form
        class="form"
        @submit.prevent="$emit('submit')">
        <slot />

        <p
            v-if="error"
            class="form__error">
            {{ error }}
        </p>

        <BaseButton
            type="submit"
            :loading="submitting"
            block>
            {{ submitLabel ?? "Сохранить" }}
        </BaseButton>

        <slot name="footer" />
    </form>
</template>

<style scoped lang="scss">
.form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    &__error {
        color: var(--color-danger);
        font-size: var(--text-sm);
    }
}
</style>
