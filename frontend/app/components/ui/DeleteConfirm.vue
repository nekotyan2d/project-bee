<script setup lang="ts">
defineProps<{
    label: string;
    deleting?: boolean;
    warning?: string;
}>();

const emit = defineEmits<{ confirm: [] }>();

const confirmDelete = ref(false);
</script>

<template>
    <div class="danger-zone">
        <template v-if="!confirmDelete">
            <BaseButton
                variant="danger-outline"
                block
                @click="confirmDelete = true">
                {{ label }}
            </BaseButton>
        </template>
        <template v-else>
            <p
                v-if="warning"
                class="danger-zone__warning danger-zone__warning--consequence">
                {{ warning }}
            </p>
            <p class="danger-zone__warning">Удаление нельзя отменить.</p>
            <BaseButton
                variant="danger-outline"
                block
                :disabled="deleting"
                @click="emit('confirm')">
                {{ deleting ? "Удаление…" : "Подтвердить удаление" }}
            </BaseButton>
            <BaseButton
                variant="secondary"
                block
                @click="confirmDelete = false">
                Отмена
            </BaseButton>
        </template>
    </div>
</template>

<style scoped lang="scss">
.danger-zone {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);

    &__warning {
        font-size: var(--text-sm);
        color: var(--color-text-muted);

        &--consequence {
            color: var(--color-text);
            font-weight: 600;
        }
    }
}
</style>
