<script setup lang="ts">
import type { InspectionStatus } from "~/utils/attention";

defineProps<{ status: InspectionStatus | null }>();
</script>

<template>
    <span
        v-if="status && status.level !== 'ok'"
        class="attention"
        :data-level="status.level">
        <Icon
            name="lucide:search"
            size="13" />
        {{ status.label }}
    </span>
</template>

<style scoped lang="scss">
.attention {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    flex-shrink: 0;
    font-size: var(--text-xs);
    font-weight: 600;
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);

    &[data-level="warn"] {
        background: color-mix(in srgb, var(--color-warning) 18%, transparent);
        color: var(--color-warning);
    }

    &[data-level="alert"] {
        background: color-mix(in srgb, var(--color-danger) 15%, transparent);
        color: var(--color-danger);
    }
}
</style>
