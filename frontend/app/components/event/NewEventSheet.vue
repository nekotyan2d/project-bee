<script setup lang="ts">
defineProps<{ colonyId: string }>();

const open = defineModel<boolean>({ required: true });

const FREQUENT_EVENTS = [
    { type: "inspection", icon: "lucide:search", label: "Осмотр" },
    { type: "super_change", icon: "lucide:layers", label: "Магазин" },
    { type: "treatment", icon: "lucide:flask-conical", label: "Обработка" },
    { type: "feeding", icon: "lucide:droplets", label: "Подкормка" },
    { type: "harvest", icon: "lucide:droplet", label: "Откачка" },
    { type: "note", icon: "lucide:file-text", label: "Заметка" },
] as const;

const LIFECYCLE_EVENTS = [
    { type: "queen_change", icon: "lucide:crown", label: "Смена матки" },
    { type: "swarm", icon: "lucide:wind", label: "Роение" },
    { type: "migration", icon: "lucide:arrow-right", label: "Переезд" },
    { type: "split", icon: "lucide:git-fork", label: "Деление" },
    { type: "merge", icon: "lucide:git-merge", label: "Объединение" },
    { type: "death", icon: "lucide:x", label: "Гибель" },
] as const;
</script>

<template>
    <BaseBottomSheet v-model="open">
        <SheetTitle>Записать событие</SheetTitle>
        <nav class="event-list">
            <SheetItem
                v-for="action in FREQUENT_EVENTS"
                :key="action.type"
                :to="`/events/new?colonyId=${colonyId}&type=${action.type}`"
                :icon="action.icon"
                :label="action.label"
                @click="open = false" />

            <p class="event-list__group">Жизненный цикл</p>

            <SheetItem
                v-for="action in LIFECYCLE_EVENTS"
                :key="action.type"
                :to="`/events/new?colonyId=${colonyId}&type=${action.type}`"
                :icon="action.icon"
                :label="action.label"
                @click="open = false" />
        </nav>
    </BaseBottomSheet>
</template>

<style scoped lang="scss">
.event-list {
    display: flex;
    flex-direction: column;

    &__group {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
        padding: var(--space-4) var(--space-4) var(--space-2);
    }
}
</style>
