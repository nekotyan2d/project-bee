<script setup lang="ts">
import type { LocalApiary, LocalColony, LocalHive, LocalQueen } from "~/shared/db";

useHead({ title: "Пасека" });

const db = useDb();

type QueryData = {
    apiary: LocalApiary | null;
    hives: LocalHive[];
    colonyByHiveId: Record<string, LocalColony>;
    queenById: Record<string, LocalQueen>;
};

const EMPTY: QueryData = { apiary: null, hives: [], colonyByHiveId: {}, queenById: {} };

const { data, loading } = useLiveQuery<QueryData>(async () => {
    const apiary = (await db.apiary.orderBy("updatedAt").first()) ?? null;
    if (!apiary) return EMPTY;

    const [hives, colonies] = await Promise.all([
        db.hive
            .where("apiaryId")
            .equals(apiary.id)
            .filter((h) => !h.deletedAt)
            .toArray(),
        db.colony.where("apiaryId").equals(apiary.id).toArray(),
    ]);

    const colonyByHiveId: Record<string, LocalColony> = {};
    for (const colony of colonies) {
        if (colony.currentHiveId) colonyByHiveId[colony.currentHiveId] = colony;
    }

    const queenIds = colonies.map((c) => c.currentQueenId).filter((id): id is string => !!id);
    const queens = await db.queen.bulkGet(queenIds);
    const queenById: Record<string, LocalQueen> = {};
    for (const queen of queens) {
        if (queen && !queen.deletedAt) queenById[queen.id] = queen;
    }

    return { apiary, hives, colonyByHiveId, queenById };
}, EMPTY);

function resolveQueen(colony: LocalColony | undefined): LocalQueen | undefined {
    return colony?.currentQueenId ? data.value.queenById[colony.currentQueenId] : undefined;
}

const showCreateSheet = ref(false);
const viewMode = ref<"list" | "map">("list");
</script>

<template>
    <AppPage
        :title="data.apiary?.name ?? 'Пасека'"
        variant="list">
        <template #actions>
            <BaseButton
                v-if="data.hives.length > 0"
                variant="ghost"
                size="icon"
                :aria-label="viewMode === 'list' ? 'Схема' : 'Список'"
                @click="viewMode = viewMode === 'list' ? 'map' : 'list'">
                <Icon
                    :name="viewMode === 'list' ? 'lucide:layout-grid' : 'lucide:list'"
                    size="20" />
            </BaseButton>
            <ThemeToggle />
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.hives.length > 0">
            <HiveMap
                v-if="viewMode === 'map'"
                :hives="data.hives"
                :colony-by-hive-id="data.colonyByHiveId"
                :queen-by-id="data.queenById" />
            <ul
                v-else
                class="hive-list">
                <li
                    v-for="hive in data.hives"
                    :key="hive.id">
                    <HiveCard
                        :hive="hive"
                        :colony="data.colonyByHiveId[hive.id]"
                        :queen="resolveQueen(data.colonyByHiveId[hive.id])" />
                </li>
            </ul>
        </template>

        <EmptyState
            v-else
            icon="lucide:box"
            text="Пока пусто"
            hint="Нажмите «+», чтобы добавить первую семью" />

        <template #overlay>
            <button
                type="button"
                class="fab"
                aria-label="Добавить"
                @click="showCreateSheet = true">
                <Icon
                    name="lucide:plus"
                    size="24" />
            </button>

            <BaseBottomSheet v-model="showCreateSheet">
                <p class="picker-title">Добавить</p>
                <nav class="create-list">
                    <NuxtLink
                        to="/colonies/new"
                        class="create-item"
                        @click="showCreateSheet = false">
                        <span class="create-item__icon">
                            <Icon
                                name="lucide:users"
                                size="18" />
                        </span>
                        <span class="create-item__body">
                            <span class="create-item__label">Новая семья</span>
                            <span class="create-item__hint">Семья + улей, при желании матка</span>
                        </span>
                        <Icon
                            name="lucide:chevron-right"
                            size="16"
                            class="create-item__arrow" />
                    </NuxtLink>
                    <NuxtLink
                        to="/hives/new"
                        class="create-item"
                        @click="showCreateSheet = false">
                        <span class="create-item__icon">
                            <Icon
                                name="lucide:box"
                                size="18" />
                        </span>
                        <span class="create-item__body">
                            <span class="create-item__label">Пустой улей</span>
                            <span class="create-item__hint">Ящик без семьи — заселить позже</span>
                        </span>
                        <Icon
                            name="lucide:chevron-right"
                            size="16"
                            class="create-item__arrow" />
                    </NuxtLink>
                </nav>
            </BaseBottomSheet>
        </template>
    </AppPage>
</template>

<style scoped lang="scss">
.hive-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 0;
    margin: 0;
}

.picker-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--space-4) var(--space-2);
}

.create-list {
    display: flex;
    flex-direction: column;
}

.create-item {
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

    &__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__label {
        font-size: var(--text-base);
        font-weight: 500;
    }

    &__hint {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }
}

.fab {
    position: fixed;
    bottom: calc(var(--space-3) + 56px + var(--safe-bottom));
    right: var(--space-5);
    width: 56px;
    height: 56px;
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: var(--color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: background-color var(--transition-fast);
    cursor: pointer;
    z-index: 10;

    &:active {
        background: var(--color-primary-hover);
    }
}
</style>
