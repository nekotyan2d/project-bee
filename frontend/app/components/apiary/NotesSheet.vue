<script setup lang="ts">
import type { LocalEvent } from "~/shared/db";

defineProps<{ notes: LocalEvent[] }>();

const open = defineModel<boolean>({ required: true });
</script>

<template>
    <BaseBottomSheet v-model="open">
        <div class="notes-sheet__header">
            <SheetTitle>Заметки</SheetTitle>
            <NuxtLink
                to="/events/new?type=note"
                class="notes-sheet__add"
                aria-label="Новая заметка"
                @click="open = false">
                <Icon
                    name="lucide:plus"
                    size="18" />
            </NuxtLink>
        </div>
        <div class="notes-sheet__body">
            <EventTimeline
                :events="notes"
                empty-text="Заметок пока нет"
                @navigate="open = false" />
        </div>
    </BaseBottomSheet>
</template>

<style scoped lang="scss">
.notes-sheet {
    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: var(--space-4);
    }

    &__add {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        transition: background-color var(--transition-fast);

        &:active {
            background: color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
    }

    &__body {
        padding: 0 var(--space-4) var(--space-4);

        :deep(.timeline) {
            background: var(--color-surface-2);
        }
    }
}
</style>
