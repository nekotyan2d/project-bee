<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

const props = defineProps<{
    colony: LocalColony;
    hive?: LocalHive;
    queen?: LocalQueen;
}>();

const queenSummary = computed(() => {
    const q = props.queen;
    if (!q) return null;
    return [q.year ? String(q.year) : null, q.breed].filter(Boolean).join(" · ") || "Матка";
});
</script>

<template>
    <InfoGrid>
        <InfoRow label="Улей">
            <NuxtLink
                v-if="hive"
                :to="`/hives/${hive.id}`"
                class="ref-link">
                {{ hive.label }}
                <Icon
                    name="lucide:chevron-right"
                    size="16" />
            </NuxtLink>
            <template v-else>—</template>
        </InfoRow>
        <InfoRow label="Матка">
            <NuxtLink
                v-if="queen"
                :to="`/queens/${queen.id}`"
                class="ref-link">
                {{ queenSummary }}
                <Icon
                    name="lucide:chevron-right"
                    size="16" />
            </NuxtLink>
            <NuxtLink
                v-else
                :to="`/queens/new?colonyId=${colony.id}`"
                class="ref-link">
                <Icon
                    name="lucide:plus"
                    size="14" />
                Добавить
            </NuxtLink>
        </InfoRow>
        <InfoRow label="Основана">{{ formatDate(colony.establishedAt) }}</InfoRow>
        <InfoRow
            v-if="colony.origin"
            label="Происхождение">
            {{ colony.origin }}
        </InfoRow>
    </InfoGrid>
</template>

<style scoped lang="scss">
.ref-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
}
</style>
