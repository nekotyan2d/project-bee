<script setup lang="ts">
import type { LocalApiary, LocalColony, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";

useHead({ title: "Пасека" });

const db = useDb();

type QueryData = {
    apiary: LocalApiary | null;
    hives: LocalHive[];
    colonyByHiveId: Record<string, LocalColony>;
    queenById: Record<string, LocalQueen>;
    notes: LocalEvent[];
};

const EMPTY: QueryData = { apiary: null, hives: [], colonyByHiveId: {}, queenById: {}, notes: [] };

const { data, loading } = useLiveQuery<QueryData>(async () => {
    const apiary = (await db.apiary.orderBy("updatedAt").first()) ?? null;
    if (!apiary) return EMPTY;

    const [hives, colonies, notes] = await Promise.all([
        db.hive
            .where("apiaryId")
            .equals(apiary.id)
            .filter((h) => !h.deletedAt)
            .toArray(),
        db.colony.where("apiaryId").equals(apiary.id).toArray(),
        db.event
            .where("apiaryId")
            .equals(apiary.id)
            .filter((e) => e.type === "note" && !e.colonyId && !e.deletedAt)
            .sortBy("occurredAt"),
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

    return { apiary, hives, colonyByHiveId, queenById, notes: notes.reverse() };
}, EMPTY);

function queenOf(colony: LocalColony | undefined): LocalQueen | undefined {
    return colony?.currentQueenId ? data.value.queenById[colony.currentQueenId] : undefined;
}

const showCreateSheet = ref(false);
const showNotesSheet = ref(false);

const VIEW_MODE_KEY = "hiveViewMode";

function loadViewMode(): "list" | "map" {
    if (!import.meta.client) return "list";
    return localStorage.getItem(VIEW_MODE_KEY) === "map" ? "map" : "list";
}

const viewMode = ref<"list" | "map">(loadViewMode());
watch(viewMode, (mode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
});
</script>

<template>
    <AppPage
        :title="data.apiary?.name ?? 'Пасека'"
        variant="list">
        <template #actions>
            <BaseButton
                v-if="data.apiary"
                variant="ghost"
                size="icon"
                aria-label="Заметки"
                @click="showNotesSheet = true">
                <Icon
                    name="lucide:file-text"
                    size="20" />
            </BaseButton>
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
                        :queen="queenOf(data.colonyByHiveId[hive.id])" />
                </li>
            </ul>
        </template>

        <EmptyState
            v-else
            icon="lucide:box"
            text="Пока пусто"
            hint="Нажмите «+», чтобы добавить первую семью" />

        <template #overlay>
            <FabButton
                label="Добавить"
                above-bottom-bar
                @click="showCreateSheet = true" />

            <CreateSheet v-model="showCreateSheet" />

            <NotesSheet
                v-model="showNotesSheet"
                :notes="data.notes" />
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
</style>
