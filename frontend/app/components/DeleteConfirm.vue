<script setup lang="ts">
defineProps<{
    label: string;
    deleting?: boolean;
}>();

const emit = defineEmits<{ confirm: [] }>();

const confirmDelete = ref(false);
</script>

<template>
    <div class="danger-zone">
        <template v-if="!confirmDelete">
            <button type="button" class="danger-btn" @click="confirmDelete = true">
                {{ label }}
            </button>
        </template>
        <template v-else>
            <p class="danger-zone__warning">Удаление нельзя отменить.</p>
            <button type="button" class="danger-btn" :disabled="deleting" @click="emit('confirm')">
                {{ deleting ? "Удаление…" : "Подтвердить удаление" }}
            </button>
            <button type="button" class="cancel-btn" @click="confirmDelete = false">
                Отмена
            </button>
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
    }
}

.danger-btn {
    width: 100%;
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border: 1.5px solid var(--color-danger);
    border-radius: var(--radius-md);
    background: none;
    color: var(--color-danger);
    font-size: var(--text-base);
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    transition: background-color var(--transition-fast);

    &:active {
        background: color-mix(in srgb, var(--color-danger) 10%, transparent);
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
}

.cancel-btn {
    width: 100%;
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: none;
    color: var(--color-text-muted);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    cursor: pointer;
}
</style>
