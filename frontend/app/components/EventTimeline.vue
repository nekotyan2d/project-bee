<script setup lang="ts">
import type { LocalEvent, LocalHive } from "~/shared/db";

const props = withDefaults(
    defineProps<{
        events: LocalEvent[];
        hivesById?: Record<string, LocalHive>;
        limit?: number;
        emptyText?: string;
    }>(),
    { hivesById: () => ({}), limit: undefined, emptyText: "Событий пока нет" },
);

const emit = defineEmits<{ navigate: [] }>();

const showAll = ref(false);

type EventRow = { event: LocalEvent; summary: ReturnType<typeof getEventSummary> };

// События уже отсортированы по убыванию — группируем по месяцам подряд идущими блоками.
const groups = computed(() => {
    const visible = props.limit && !showAll.value ? props.events.slice(0, props.limit) : props.events;
    const result: { key: string; label: string; rows: EventRow[] }[] = [];
    for (const event of visible) {
        const d = new Date(event.occurredAt);
        const key = `${String(d.getFullYear())}-${String(d.getMonth())}`;
        const row: EventRow = { event, summary: getEventSummary(event, props.hivesById) };
        const last = result.at(-1);
        if (last && last.key === key) last.rows.push(row);
        else result.push({ key, label: formatMonth(event.occurredAt), rows: [row] });
    }
    return result;
});

const hiddenCount = computed(() =>
    props.limit && !showAll.value ? Math.max(0, props.events.length - props.limit) : 0,
);
</script>

<template>
    <template v-if="events.length > 0">
        <div
            v-for="group in groups"
            :key="group.key"
            class="timeline-group">
            <h3 class="timeline-group__month">{{ group.label }}</h3>
            <ol class="timeline">
                <li
                    v-for="{ event, summary } in group.rows"
                    :key="event.id">
                    <NuxtLink
                        :to="`/events/${event.id}`"
                        class="timeline__link"
                        @click="emit('navigate')">
                        <span class="timeline__icon">
                            <Icon
                                :name="summary.icon"
                                size="16" />
                        </span>
                        <div class="timeline__body">
                            <span class="timeline__title">{{ summary.title }}</span>
                            <span
                                v-if="summary.detail"
                                class="timeline__detail">
                                {{ summary.detail }}
                            </span>
                        </div>
                        <time
                            class="timeline__date"
                            :datetime="event.occurredAt.toISOString()">
                            {{ relativeDate(event.occurredAt) }}
                        </time>
                    </NuxtLink>
                </li>
            </ol>
        </div>

        <button
            v-if="hiddenCount > 0"
            type="button"
            class="show-all"
            @click="showAll = true">
            Показать всю историю (ещё {{ hiddenCount }})
        </button>
    </template>
    <p
        v-else
        class="empty">
        {{ emptyText }}
    </p>
</template>

<style scoped lang="scss">
.timeline-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__month {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        padding-left: var(--space-1);
    }
}

.show-all {
    width: 100%;
    min-height: var(--tap-min);
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-primary);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }
}

.timeline {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;

    &__link {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        min-height: var(--list-item-height);
        padding: var(--space-3) var(--space-4);
        text-decoration: none;
        color: inherit;
        transition: background-color var(--transition-fast);

        &:hover {
            background: color-mix(in srgb, var(--color-text) 8%, transparent);
        }

        &:active {
            background: color-mix(in srgb, var(--color-text) 12%, transparent);
        }
    }

    &__icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        margin-top: 1px;
    }

    &__body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__title {
        font-size: var(--text-sm);
        font-weight: 600;
        overflow-wrap: break-word;
    }

    &__detail {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        line-height: 1.4;
        overflow-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__date {
        flex-shrink: 0;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        padding-top: 2px;
    }
}

.empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}
</style>
