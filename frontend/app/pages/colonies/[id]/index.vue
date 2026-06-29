<script setup lang="ts">
import Dexie from "dexie";

import type { LocalColony, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();

type PageData = {
    colony: LocalColony | undefined;
    hive: LocalHive | undefined;
    queen: LocalQueen | undefined;
    events: LocalEvent[];
    hivesById: Record<string, LocalHive>;
};

const EMPTY: PageData = { colony: undefined, hive: undefined, queen: undefined, events: [], hivesById: {} };

const { data, loading } = useLiveQuery<PageData>(async () => {
    const colony = await db.colony.get(id);
    if (!colony) return EMPTY;

    const [hive, queen, events, hives] = await Promise.all([
        colony.currentHiveId
            ? db.hive.get(colony.currentHiveId).then((h) => (h?.deletedAt ? undefined : h))
            : Promise.resolve(undefined),
        colony.currentQueenId
            ? db.queen.get(colony.currentQueenId).then((q) => (q?.deletedAt ? undefined : q))
            : Promise.resolve(undefined),
        db.event
            .where("[colonyId+occurredAt]")
            .between([colony.id, Dexie.minKey], [colony.id, Dexie.maxKey])
            .filter((e) => !e.deletedAt)
            .reverse()
            .toArray(),
        db.hive
            .where("apiaryId")
            .equals(colony.apiaryId)
            .filter((h) => !h.deletedAt)
            .toArray(),
    ]);

    const hivesById = Object.fromEntries(hives.map((h) => [h.id, h]));

    return { colony, hive, queen, events, hivesById };
}, EMPTY);

useHead(() => ({ title: data.value.colony ? `${data.value.colony.label} — Пасека` : "Семья — Пасека" }));

const STATUS_LABEL: Record<string, string> = {
    active: "Активна",
    dead: "Погибла",
    merged: "Объединена",
    split: "Разделена",
};

const nestFrames = computed<number | null>(() => {
    for (const e of data.value.events) {
        if (e.type === "inspection" && typeof e.payload.framesTotal === "number") return e.payload.framesTotal;
    }
    return null;
});

const nestLabel = computed(() => {
    if (nestFrames.value === null) return "—";
    const capacity = data.value.hive?.frameCount;
    return capacity ? `${String(nestFrames.value)} / ${String(capacity)}` : String(nestFrames.value);
});

const inspStatus = computed(() => (data.value.colony ? inspectionStatus(data.value.colony.lastInspectedAt) : null));

const queenSummary = computed(() => {
    const q = data.value.queen;
    if (!q) return null;
    return [q.year ? String(q.year) : null, q.breed].filter(Boolean).join(" · ") || "Матка";
});

const EVENT_LIMIT = 15;
const showAllEvents = ref(false);

// История сгруппирована по месяцам (события уже отсортированы по убыванию).
type EventRow = { event: LocalEvent; summary: ReturnType<typeof getEventSummary> };
const eventGroups = computed(() => {
    const visible = showAllEvents.value ? data.value.events : data.value.events.slice(0, EVENT_LIMIT);
    const groups: { key: string; label: string; rows: EventRow[] }[] = [];
    for (const event of visible) {
        const d = new Date(event.occurredAt);
        const key = `${String(d.getFullYear())}-${String(d.getMonth())}`;
        const row: EventRow = { event, summary: getEventSummary(event, data.value.hivesById) };
        const last = groups.at(-1);
        if (last && last.key === key) last.rows.push(row);
        else groups.push({ key, label: formatMonth(event.occurredAt), rows: [row] });
    }
    return groups;
});

const hiddenCount = computed(() => (showAllEvents.value ? 0 : Math.max(0, data.value.events.length - EVENT_LIMIT)));

const showEventSheet = ref(false);

// Частые/сезонные события — вверху шита; редкий жизненный цикл — ниже.
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
    <AppPage
        :title="data.colony?.label ?? 'Семья'"
        back-to="/"
        variant="stack">
        <template #actions>
            <BaseButton
                variant="ghost"
                size="icon"
                :to="`/colonies/${id}/edit`"
                aria-label="Редактировать">
                <Icon
                    name="lucide:pencil"
                    size="20" />
            </BaseButton>
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.colony">
            <div class="health">
                <span
                    class="status-badge"
                    :data-status="data.colony.status">
                    {{ STATUS_LABEL[data.colony.status] ?? data.colony.status }}
                </span>
                <span
                    v-if="inspStatus && inspStatus.level !== 'ok'"
                    class="attention"
                    :data-level="inspStatus.level">
                    <Icon
                        name="lucide:search"
                        size="13" />
                    {{ inspStatus.label }}
                </span>
            </div>

            <!-- Metrics -->
            <section class="section">
                <h2 class="section__title">Показатели</h2>
                <div class="metrics">
                    <NuxtLink
                        :to="`/events/new/?colonyId=${id}&type=inspection`"
                        class="metric">
                        <Icon
                            name="lucide:search"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{
                            daysAgo(data.colony.lastInspectedAt) ?? "Не осматривалась"
                        }}</span>
                        <span class="metric__label">Последний осмотр</span>
                    </NuxtLink>
                    <NuxtLink
                        class="metric"
                        :to="`/events/new/?colonyId=${id}&type=super_change`">
                        <Icon
                            name="lucide:layers"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{ data.colony.superCount }}</span>
                        <span class="metric__label">Магазинов</span>
                    </NuxtLink>
                    <NuxtLink
                        class="metric"
                        :to="`/events/new/?colonyId=${id}&type=inspection`">
                        <Icon
                            name="lucide:layout-list"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{ nestLabel }}</span>
                        <span class="metric__label">Гнездо</span>
                    </NuxtLink>
                </div>
            </section>

            <section class="section">
                <h2 class="section__title">Сведения</h2>
                <InfoGrid>
                    <InfoRow label="Улей">
                        <NuxtLink
                            v-if="data.hive"
                            :to="`/hives/${data.hive.id}`"
                            class="ref-link">
                            {{ data.hive.label }}
                            <Icon
                                name="lucide:chevron-right"
                                size="16" />
                        </NuxtLink>
                        <template v-else>—</template>
                    </InfoRow>
                    <InfoRow label="Матка">
                        <NuxtLink
                            v-if="data.queen"
                            :to="`/queens/${data.queen.id}`"
                            class="ref-link">
                            {{ queenSummary }}
                            <Icon
                                name="lucide:chevron-right"
                                size="16" />
                        </NuxtLink>
                        <NuxtLink
                            v-else
                            :to="`/queens/new?colonyId=${id}`"
                            class="ref-link">
                            <Icon
                                name="lucide:plus"
                                size="14" />
                            Добавить
                        </NuxtLink>
                    </InfoRow>
                    <InfoRow label="Основана">{{ formatDate(data.colony.establishedAt) }}</InfoRow>
                    <InfoRow
                        v-if="data.colony.origin"
                        label="Происхождение">
                        {{ data.colony.origin }}
                    </InfoRow>
                </InfoGrid>
            </section>

            <section class="section">
                <h2 class="section__title">История событий</h2>

                <template v-if="data.events.length > 0">
                    <div
                        v-for="group in eventGroups"
                        :key="group.key"
                        class="timeline-group">
                        <h3 class="timeline-group__month">{{ group.label }}</h3>
                        <ol class="timeline">
                            <li
                                v-for="{ event, summary } in group.rows"
                                :key="event.id">
                                <NuxtLink
                                    :to="`/events/${event.id}`"
                                    class="timeline__link">
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
                        @click="showAllEvents = true">
                        Показать всю историю (ещё {{ hiddenCount }})
                    </button>
                </template>
                <p
                    v-else
                    class="section__empty">
                    Событий пока нет
                </p>
            </section>
        </template>

        <div
            v-else
            class="not-found">
            <p>Семья не найдена</p>
            <NuxtLink to="/">На главную</NuxtLink>
        </div>

        <template
            v-if="data.colony"
            #overlay>
            <button
                type="button"
                class="fab"
                aria-label="Записать событие"
                @click="showEventSheet = true">
                <Icon
                    name="lucide:plus"
                    size="24" />
            </button>

            <BaseBottomSheet v-model="showEventSheet">
                <p class="sheet-title">Записать событие</p>
                <nav class="event-list">
                    <NuxtLink
                        v-for="action in FREQUENT_EVENTS"
                        :key="action.type"
                        :to="`/events/new?colonyId=${id}&type=${action.type}`"
                        class="event-item"
                        @click="showEventSheet = false">
                        <span class="event-item__icon">
                            <Icon
                                :name="action.icon"
                                size="18" />
                        </span>
                        <span class="event-item__label">{{ action.label }}</span>
                    </NuxtLink>

                    <p class="event-list__group">Жизненный цикл</p>

                    <NuxtLink
                        v-for="action in LIFECYCLE_EVENTS"
                        :key="action.type"
                        :to="`/events/new?colonyId=${id}&type=${action.type}`"
                        class="event-item"
                        @click="showEventSheet = false">
                        <span class="event-item__icon">
                            <Icon
                                :name="action.icon"
                                size="18" />
                        </span>
                        <span class="event-item__label">{{ action.label }}</span>
                    </NuxtLink>
                </nav>
            </BaseBottomSheet>
        </template>
    </AppPage>
</template>

<style scoped lang="scss">
.health {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
}

.attention {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
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

.fab {
    position: fixed;
    bottom: calc(var(--space-5) + var(--safe-bottom));
    right: var(--space-5);
    width: 56px;
    height: 56px;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: background-color var(--transition-fast);
    cursor: pointer;
    z-index: 10;

    &:active {
        background: color-mix(in srgb, var(--color-primary-container) 88%, var(--color-on-primary-container) 12%);
    }
}

.sheet-title {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text-muted);
    padding: 0 var(--space-4) var(--space-2);
}

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

.event-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    color: var(--color-text);
    min-height: var(--tap-min);
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &__icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        flex-shrink: 0;
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 500;
    }
}

.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__title {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
    }

    &__empty {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
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

.ref-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;
}

.metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
}

.metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    text-align: center;

    &__icon {
        color: var(--color-primary);
    }

    &__value {
        font-size: var(--text-base);
        font-weight: 700;
    }

    &__label {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
    }
}

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
    }

    &__detail {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        line-height: 1.4;
    }

    &__date {
        flex-shrink: 0;
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        padding-top: 2px;
    }
}

.not-found {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--color-text-muted);
}
</style>
