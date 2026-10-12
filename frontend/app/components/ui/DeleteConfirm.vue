<script setup lang="ts">
defineProps<{
    label: string;
    deleting?: boolean;
    warning?: string;
}>();

const emit = defineEmits<{ confirm: [] }>();

const open = ref(false);
</script>

<template>
    <div class="danger-zone">
        <BaseButton
            variant="danger-outline"
            block
            @click="open = true">
            {{ label }}
        </BaseButton>

        <BaseBottomSheet v-model="open">
            <SheetTitle>{{ label }}?</SheetTitle>
            <div class="confirm">
                <p
                    v-if="warning"
                    class="confirm__warning">
                    {{ warning }}
                </p>
                <p class="confirm__note">Удаление нельзя отменить.</p>
                <BaseButton
                    variant="danger"
                    block
                    :loading="deleting"
                    @click="emit('confirm')">
                    Подтвердить удаление
                </BaseButton>
                <BaseButton
                    variant="secondary"
                    block
                    :disabled="deleting"
                    @click="open = false">
                    Отмена
                </BaseButton>
            </div>
        </BaseBottomSheet>
    </div>
</template>

<style scoped lang="scss">
.danger-zone {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
}

.confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: 0 var(--space-4);

    &__warning {
        font-size: var(--text-sm);
        font-weight: 600;
    }

    &__note {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}
</style>
