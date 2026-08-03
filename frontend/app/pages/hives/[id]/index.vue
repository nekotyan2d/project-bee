<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { LocalColony, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { enqueue } = useSync();

type PageData = {
    hive: LocalHive | undefined;
    colony: LocalColony | undefined;
    queen: LocalQueen | undefined;
    unassigned: LocalColony[];
};

const EMPTY: PageData = { hive: undefined, colony: undefined, queen: undefined, unassigned: [] };

const { data, loading } = useLiveQuery<PageData>(async () => {
    const hive = await db.hive.get(id);
    if (!hive) return EMPTY;

    const colony = await db.colony.where("currentHiveId").equals(id).first();
    const queen = colony?.currentQueenId ? await db.queen.get(colony.currentQueenId) : undefined;

    const unassigned = colony
        ? []
        : await db.colony
              .where("apiaryId")
              .equals(hive.apiaryId)
              .filter((c) => !c.currentHiveId && c.status === "active")
              .toArray();

    return { hive, colony, queen, unassigned };
}, EMPTY);

useHead(() => ({ title: data.value.hive ? `${data.value.hive.label} — Пасека` : "Улей — Пасека" }));

const TYPE_LABEL: Record<string, string> = {
    dadant: "Дадан",
    rut: "Рут",
    ukrainian: "Украинский",
    multi_hull: "Многокорпусный",
};

const STATUS_LABEL: Record<string, string> = {
    active: "Активен",
    inactive: "Неактивен",
};

const showPicker = ref(false);

async function assignColony(colony: LocalColony): Promise<void> {
    const hive = data.value.hive;
    if (!hive) return;

    const now = new Date();
    const event: LocalEvent = {
        id: uuidv7(),
        apiaryId: colony.apiaryId,
        colonyId: colony.id,
        type: "migration",
        occurredAt: now,
        payload: { toHiveId: hive.id },
        updatedAt: now,
    };

    await db.transaction("rw", db.colony, db.event, async () => {
        await db.colony.update(colony.id, { currentHiveId: hive.id, updatedAt: now });
        await db.event.add(event);
    });

    showPicker.value = false;

    void enqueue("event", event.id, "upsert");
}
</script>

<template>
    <AppPage
        :title="data.hive?.label ?? 'Улей'"
        back-to="/"
        variant="stack">
        <template #actions>
            <BaseButton
                variant="ghost"
                size="icon"
                :to="`/hives/${id}/edit`"
                aria-label="Редактировать">
                <Icon
                    name="lucide:pencil"
                    size="20" />
            </BaseButton>
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.hive">
            <section class="section">
                <InfoGrid>
                    <InfoRow label="Статус">{{ STATUS_LABEL[data.hive.status] ?? data.hive.status }}</InfoRow>
                    <InfoRow
                        v-if="data.hive.type"
                        label="Тип">
                        {{ TYPE_LABEL[data.hive.type] ?? data.hive.type }}
                    </InfoRow>
                    <InfoRow
                        v-if="data.hive.frameCount"
                        label="Вместимость">
                        {{ data.hive.frameCount }} рамок
                    </InfoRow>
                    <InfoRow
                        v-if="data.hive.color"
                        label="Цвет">
                        <span
                            class="color-dot"
                            :style="{ background: hiveColorHex(data.hive.color) || data.hive.color }" />
                    </InfoRow>
                </InfoGrid>
            </section>

            <section class="section">
                <h2 class="section__title">Семья</h2>

                <template v-if="data.colony">
                    <NuxtLink
                        :to="`/colonies/${data.colony.id}`"
                        class="colony-link">
                        <div class="colony-link__top">
                            <span class="colony-link__label">{{ data.colony.label }}</span>
                            <Icon
                                name="lucide:chevron-right"
                                size="18"
                                class="colony-link__arrow" />
                        </div>
                        <div class="colony-link__meta">
                            <span
                                v-if="data.colony.lastInspectedAt"
                                class="colony-link__meta-item">
                                <Icon
                                    name="lucide:search"
                                    size="14" />
                                {{ daysAgo(data.colony.lastInspectedAt) }}
                            </span>
                            <span
                                v-if="data.colony.superCount > 0"
                                class="colony-link__meta-item">
                                <Icon
                                    name="lucide:layers"
                                    size="14" />
                                {{ data.colony.superCount }}
                                {{ data.colony.superCount === 1 ? "магазин" : "магазина" }}
                            </span>
                            <span
                                v-if="data.queen"
                                class="colony-link__meta-item">
                                <Icon
                                    name="lucide:crown"
                                    size="14" />
                                {{ data.queen.year ? `Матка ${String(data.queen.year)}` : "Матка" }}
                            </span>
                        </div>
                    </NuxtLink>
                </template>

                <template v-else>
                    <p class="section__empty">Улей пустой</p>

                    <div class="actions">
                        <NuxtLink
                            :to="`/colonies/new?hiveId=${data.hive.id}`"
                            class="action-btn action-btn--primary">
                            <Icon
                                name="lucide:plus"
                                size="18" />
                            Новая семья
                        </NuxtLink>
                        <BaseButton
                            v-if="data.unassigned.length > 0"
                            variant="secondary"
                            @click="showPicker = !showPicker">
                            <Icon
                                name="lucide:link"
                                size="20" />
                            Привязать семью
                        </BaseButton>
                    </div>

                    <ul
                        v-if="showPicker"
                        class="picker">
                        <li
                            v-for="colony in data.unassigned"
                            :key="colony.id">
                            <button
                                class="picker__item"
                                type="button"
                                @click="assignColony(colony)">
                                <span class="picker__label">{{ colony.label }}</span>
                                <Icon
                                    name="lucide:chevron-right"
                                    size="16"
                                    class="picker__arrow" />
                            </button>
                        </li>
                    </ul>
                </template>
            </section>
        </template>

        <div
            v-else
            class="not-found">
            <p>Улей не найден</p>
            <NuxtLink to="/">На главную</NuxtLink>
        </div>
    </AppPage>
</template>

<style scoped lang="scss">
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

.color-dot {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    vertical-align: middle;
}

.colony-link {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
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
    }

    &__meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
    }

    &__meta-item {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}

.actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    text-decoration: none;
    transition: background-color var(--transition-fast);

    &--primary {
        background: var(--color-primary-container);
        color: var(--color-on-primary-container);

        &:active {
            background: var(--color-primary-hover);
        }
    }
}

.picker {
    list-style: none;
    padding: 0;
    margin: 0;
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: var(--space-3) var(--space-4);
        background: none;
        border: none;
        font-size: var(--text-base);
        color: var(--color-text);
        cursor: pointer;
        min-height: var(--list-item-height);
        transition: background-color var(--transition-fast);

        &:hover {
            background: color-mix(in srgb, var(--color-text) 8%, transparent);
        }

        &:active {
            background: color-mix(in srgb, var(--color-text) 12%, transparent);
        }
    }

    &__label {
        font-weight: 500;
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
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
