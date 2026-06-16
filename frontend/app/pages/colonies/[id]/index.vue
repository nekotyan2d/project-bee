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

const QUICK_ACTIONS = [
    { type: "inspection", icon: "lucide:search", label: "Осмотр" },
    { type: "super_change", icon: "lucide:layers", label: "Магазин" },
    { type: "treatment", icon: "lucide:flask-conical", label: "Обработка" },
    { type: "feeding", icon: "lucide:droplets", label: "Подкормка" },
    { type: "harvest", icon: "lucide:droplet", label: "Откачка" },
    { type: "queen_change", icon: "lucide:crown", label: "Смена матки" },
    { type: "swarm", icon: "lucide:wind", label: "Роение" },
    { type: "note", icon: "lucide:file-text", label: "Заметка" },
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
            <NuxtLink
                :to="`/colonies/${id}/edit`"
                class="topbar-edit"
                aria-label="Редактировать">
                <Icon
                    name="lucide:pencil"
                    size="20" />
            </NuxtLink>
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.colony">
            <nav class="quick-actions">
                <NuxtLink
                    v-for="action in QUICK_ACTIONS"
                    :key="action.type"
                    :to="`/events/new?colonyId=${id}&type=${action.type}`"
                    class="quick-action">
                    <Icon
                        :name="action.icon"
                        size="24"
                        class="quick-action__icon" />
                    <span class="quick-action__label">{{ action.label }}</span>
                </NuxtLink>
            </nav>

            <section class="section">
                <InfoGrid>
                    <InfoRow label="Статус">
                        <span
                            class="status-badge"
                            :data-status="data.colony.status">
                            {{ STATUS_LABEL[data.colony.status] ?? data.colony.status }}
                        </span>
                    </InfoRow>
                    <InfoRow label="Улей">
                        <NuxtLink v-if="data.hive" :to="`/hives/${data.hive.id}`" class="hive-ref">
                            {{ data.hive.label }}
                            <Icon name="lucide:chevron-right" size="16" />
                        </NuxtLink>
                        <template v-else>—</template>
                    </InfoRow>
                    <InfoRow label="Основана">{{ formatDate(data.colony.establishedAt) }}</InfoRow>
                    <InfoRow
                        v-if="data.colony.origin"
                        label="Происхождение">
                        {{ data.colony.origin }}
                    </InfoRow>
                </InfoGrid>
            </section>

            <!-- Metrics -->
            <section class="section">
                <h2 class="section__title">Показатели</h2>
                <div class="metrics">
                    <div class="metric">
                        <Icon
                            name="lucide:search"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{
                            daysAgo(data.colony.lastInspectedAt) ?? "Не осматривалась"
                        }}</span>
                        <span class="metric__label">Последний осмотр</span>
                    </div>
                    <div class="metric">
                        <Icon
                            name="lucide:layers"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{ data.colony.superCount }}</span>
                        <span class="metric__label">Магазинов</span>
                    </div>
                    <div class="metric">
                        <Icon
                            name="lucide:layout-list"
                            size="20"
                            class="metric__icon" />
                        <span class="metric__value">{{ nestLabel }}</span>
                        <span class="metric__label">Гнездо</span>
                    </div>
                </div>
            </section>

            <!-- Queen -->
            <section class="section">
                <h2 class="section__title">Матка</h2>
                <template v-if="data.queen">
                    <NuxtLink
                        :to="`/queens/${data.queen.id}`"
                        class="queen-link">
                        <div class="queen-link__top">
                            <span class="queen-link__label">
                                {{ data.queen.year ? `Матка ${String(data.queen.year)}` : "Матка" }}
                                {{ data.queen.breed ? ` · ${data.queen.breed}` : "" }}
                            </span>
                            <Icon
                                name="lucide:chevron-right"
                                size="18"
                                class="queen-link__arrow" />
                        </div>
                        <div
                            v-if="data.queen.introducedAt"
                            class="queen-link__meta">
                            <Icon
                                name="lucide:calendar"
                                size="14" />
                            Подсажена {{ formatDate(data.queen.introducedAt) }}
                        </div>
                    </NuxtLink>
                </template>
                <template v-else>
                    <p class="section__empty">Матка не зарегистрирована</p>
                    <NuxtLink
                        :to="`/queens/new?colonyId=${id}`"
                        class="add-link">
                        <Icon
                            name="lucide:plus"
                            size="16" />
                        Добавить матку
                    </NuxtLink>
                </template>
            </section>

            <section class="section">
                <h2 class="section__title">История событий</h2>

                <template v-if="data.events.length > 0">
                    <ol class="timeline">
                        <li
                            v-for="event in data.events"
                            :key="event.id"
                            class="timeline__item">
                            <NuxtLink
                                :to="`/events/${event.id}`"
                                class="timeline__link">
                                <span class="timeline__icon">
                                    <Icon
                                        :name="getEventSummary(event, data.hivesById).icon"
                                        size="16" />
                                </span>
                                <div class="timeline__body">
                                    <span class="timeline__title">{{
                                        getEventSummary(event, data.hivesById).title
                                    }}</span>
                                    <span
                                        v-if="getEventSummary(event, data.hivesById).detail"
                                        class="timeline__detail">
                                        {{ getEventSummary(event, data.hivesById).detail }}
                                    </span>
                                </div>
                                <time
                                    class="timeline__date"
                                    :datetime="event.occurredAt.toISOString()">
                                    {{ formatDateShort(event.occurredAt) }}
                                </time>
                            </NuxtLink>
                        </li>
                    </ol>
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
    </AppPage>
</template>

<style scoped lang="scss">
.quick-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
}

.quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text);
    text-decoration: none;
    box-shadow: var(--shadow-sm);
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &:first-child {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: var(--color-on-primary);
        box-shadow: none;

        &:active {
            background: var(--color-primary-hover);
        }
    }

    &__icon {
        flex-shrink: 0;
    }

    &__label {
        font-size: var(--text-sm);
        font-weight: 600;
        text-align: center;
        line-height: 1.2;
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

.hive-ref {
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
    border: 1px solid var(--color-border);
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

.queen-link {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    text-decoration: none;
    color: inherit;
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 600;
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }

    &__meta {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}

.add-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;
    min-height: var(--tap-min);
}

.topbar-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--tap-min);
    min-height: var(--tap-min);
    color: var(--color-text);
    text-decoration: none;
}

.timeline {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;

    &__item {
        & + & {
            border-top: 1px solid var(--color-border);
        }
    }

    &__link {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        text-decoration: none;
        color: inherit;
        transition: background-color var(--transition-fast);

        &:active {
            background: var(--color-surface-2);
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
