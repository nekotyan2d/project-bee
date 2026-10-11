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

const EVENT_LIMIT = 15;

const showEventSheet = ref(false);
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
            <ColonyHealthBadges :colony="data.colony" />

            <PageSection title="Показатели">
                <ColonyMetrics
                    :colony="data.colony"
                    :hive="data.hive"
                    :events="data.events" />
            </PageSection>

            <PageSection title="Сведения">
                <ColonyInfo
                    :colony="data.colony"
                    :hive="data.hive"
                    :queen="data.queen" />
            </PageSection>

            <PageSection title="История событий">
                <EventTimeline
                    :events="data.events"
                    :hives-by-id="data.hivesById"
                    :limit="EVENT_LIMIT" />
            </PageSection>
        </template>

        <NotFoundState
            v-else
            text="Семья не найдена" />

        <template
            v-if="data.colony"
            #overlay>
            <FabButton
                label="Записать событие"
                @click="showEventSheet = true" />

            <NewEventSheet
                v-model="showEventSheet"
                :colony-id="id" />
        </template>
    </AppPage>
</template>
