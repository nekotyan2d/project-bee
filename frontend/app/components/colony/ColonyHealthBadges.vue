<script setup lang="ts">
import type { LocalColony } from "~/shared/db";

const props = defineProps<{ colony: LocalColony }>();

const STATUS_LABEL: Record<string, string> = {
    active: "Активна",
    dead: "Погибла",
    merged: "Объединена",
    split: "Разделена",
};

const inspection = computed(() => inspectionStatus(props.colony.lastInspectedAt));
const visible = computed(() => props.colony.status !== "active" || inspection.value.level !== "ok");
</script>

<template>
    <div
        v-if="visible"
        class="health">
        <span
            v-if="colony.status !== 'active'"
            class="status-badge"
            :data-status="colony.status">
            {{ STATUS_LABEL[colony.status] ?? colony.status }}
        </span>
        <AttentionBadge :status="inspection" />
    </div>
</template>

<style scoped lang="scss">
.health {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
}

.status-badge {
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);

    &[data-status="active"] {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
    }

    &[data-status="dead"] {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
    }

    &[data-status="merged"],
    &[data-status="split"] {
        background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
        color: var(--color-text-muted);
    }
}
</style>
