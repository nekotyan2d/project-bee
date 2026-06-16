<script setup lang="ts">
import type { LocalColony, LocalHive } from "~/shared/db";

useHead({ title: "Семьи — Пасека" });

const db = useDb();

type QueryData = {
    colonies: LocalColony[];
    hivesById: Record<string, LocalHive>;
};

const EMPTY: QueryData = { colonies: [], hivesById: {} };

const { data, loading } = useLiveQuery<QueryData>(async () => {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return EMPTY;

    const [colonies, hives] = await Promise.all([
        db.colony.where("apiaryId").equals(apiary.id).toArray(),
        db.hive
            .where("apiaryId")
            .equals(apiary.id)
            .filter((h) => !h.deletedAt)
            .toArray(),
    ]);

    return {
        colonies,
        hivesById: Object.fromEntries(hives.map((h) => [h.id, h])),
    };
}, EMPTY);
</script>

<template>
    <AppPage
        title="Семьи"
        back-to="/"
        variant="list">
        <LoadingSpinner v-if="loading" />

        <ul
            v-else-if="data.colonies.length > 0"
            class="colony-list">
            <li
                v-for="colony in data.colonies"
                :key="colony.id">
                <ColonyCard
                    :colony="colony"
                    :hive="colony.currentHiveId ? data.hivesById[colony.currentHiveId] : undefined" />
            </li>
        </ul>

        <EmptyState
            v-else
            icon="lucide:users"
            text="Семей пока нет"
            hint="Нажмите «+», чтобы добавить первую семью" />

        <template #overlay>
            <NuxtLink
                to="/colonies/new"
                class="fab"
                aria-label="Добавить семью">
                <Icon
                    name="lucide:plus"
                    size="24" />
            </NuxtLink>
        </template>
    </AppPage>
</template>

<style scoped lang="scss">
.colony-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 0;
    margin: 0;
}

.fab {
    position: fixed;
    bottom: calc(var(--space-5) + var(--safe-bottom));
    right: var(--space-5);
    width: 56px;
    height: 56px;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: var(--color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: background-color var(--transition-fast);
    text-decoration: none;

    &:active {
        background: var(--color-primary-hover);
    }
}
</style>
