<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { assignColonyToHive } = useEntityWriter();

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

    let unassigned: LocalColony[] = [];
    if (!colony) {
        const [colonies, hives] = await Promise.all([
            db.colony.where("apiaryId").equals(hive.apiaryId).toArray(),
            db.hive
                .where("apiaryId")
                .equals(hive.apiaryId)
                .filter((h) => !h.deletedAt)
                .toArray(),
        ]);
        const liveHiveIds = new Set(hives.map((h) => h.id));
        unassigned = colonies.filter((c) => needsHive(c, liveHiveIds));
    }

    return { hive, colony, queen: queen?.deletedAt ? undefined : queen, unassigned };
}, EMPTY);

useHead(() => ({ title: data.value.hive ? `${data.value.hive.label} — Пасека` : "Улей — Пасека" }));

async function assignColony(colony: LocalColony): Promise<void> {
    await assignColonyToHive(colony, id);
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
            <PageSection>
                <HiveInfo :hive="data.hive" />
            </PageSection>

            <PageSection title="Семья">
                <HiveColonyLink
                    v-if="data.colony"
                    :colony="data.colony"
                    :queen="data.queen" />
                <HiveEmptyState
                    v-else
                    :hive-id="data.hive.id"
                    :unassigned="data.unassigned"
                    @assign="assignColony" />
            </PageSection>
        </template>

        <NotFoundState
            v-else
            text="Улей не найден" />
    </AppPage>
</template>
