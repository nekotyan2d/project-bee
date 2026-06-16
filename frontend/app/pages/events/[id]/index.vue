<script setup lang="ts">
import type { LocalColony, LocalEvent, LocalHive } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { enqueue } = useSync();

type PageData = {
    event: LocalEvent | undefined;
    colony: LocalColony | undefined;
    hivesById: Record<string, LocalHive>;
    queenLabel: string | undefined;
};

const EMPTY: PageData = { event: undefined, colony: undefined, hivesById: {}, queenLabel: undefined };

const { data, loading } = useLiveQuery<PageData>(async () => {
    const event = await db.event.get(id);
    if (!event || event.deletedAt) return EMPTY;

    const colony = event.colonyId ? await db.colony.get(event.colonyId) : undefined;

    const hivesById: Record<string, LocalHive> = {};
    if (event.type === "migration" && typeof event.payload.toHiveId === "string") {
        const hive = await db.hive.get(event.payload.toHiveId);
        if (hive) hivesById[hive.id] = hive;
    }

    let queenLabel: string | undefined;
    if (event.type === "queen_change" && typeof event.payload.queenId === "string") {
        const queen = await db.queen.get(event.payload.queenId);
        if (queen) queenLabel = queen.breed ?? (queen.year ? `Матка ${String(queen.year)}` : "Матка");
    }

    return { event, colony, hivesById, queenLabel };
}, EMPTY);

const summary = computed(() => data.value.event ? getEventSummary(data.value.event, data.value.hivesById) : null);
const fields = computed(() =>
    data.value.event
        ? getEventFields(data.value.event, {
              hiveLabel: data.value.event.type === "migration" && typeof data.value.event.payload.toHiveId === "string"
                  ? data.value.hivesById[data.value.event.payload.toHiveId]?.label
                  : undefined,
              queenLabel: data.value.queenLabel,
          })
        : [],
);

const occurredLabel = computed(() => data.value.event ? formatDateTime(data.value.event.occurredAt) : "");
const backTo = computed(() => data.value.colony ? `/colonies/${data.value.colony.id}` : "/");

const EDITABLE_TYPES = ["inspection", "super_change", "treatment", "feeding", "harvest", "swarm", "note"];
const canEdit = computed(() => !!data.value.event && EDITABLE_TYPES.includes(data.value.event.type));

useHead(() => ({ title: summary.value ? `${summary.value.title} — Пасека` : "Событие — Пасека" }));

const deleting = ref(false);

async function deleteEvent(): Promise<void> {
    const event = data.value.event;
    if (!event) return;
    deleting.value = true;

    const now = new Date();
    const colonyId = event.colonyId;

    await db.transaction("rw", db.event, db.colony, async () => {
        await db.event.update(id, { deletedAt: now, updatedAt: now });
        if (colonyId) {
            const colony = await db.colony.get(colonyId);
            if (colony) {
                const events = await db.event.where("colonyId").equals(colonyId).toArray();
                const s = deriveColonyState(events);
                colony.superCount = s.superCount;
                if (s.lastInspectedAt) colony.lastInspectedAt = s.lastInspectedAt;
                else delete colony.lastInspectedAt;
                if (s.currentHiveId) colony.currentHiveId = s.currentHiveId;
                else delete colony.currentHiveId;
                if (s.currentQueenId) colony.currentQueenId = s.currentQueenId;
                else delete colony.currentQueenId;
                colony.updatedAt = now;
                await db.colony.put(colony);
            }
        }
    });

    void enqueue("event", id, "delete");

    await navigateTo(colonyId ? `/colonies/${colonyId}` : "/");
}
</script>

<template>
    <AppPage :title="summary?.title ?? 'Событие'" :back-to="backTo" variant="stack">
        <template v-if="canEdit" #actions>
            <NuxtLink :to="`/events/new?eventId=${id}`" class="topbar-edit" aria-label="Редактировать">
                <Icon name="lucide:pencil" size="20" />
            </NuxtLink>
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.event && summary">
            <div class="head">
                <span class="head__icon">
                    <Icon :name="summary.icon" size="22" />
                </span>
                <div class="head__text">
                    <span class="head__title">{{ summary.title }}</span>
                    <span class="head__date">{{ occurredLabel }}</span>
                </div>
            </div>

            <InfoGrid v-if="fields.length > 0">
                <InfoRow v-for="field in fields" :key="field.label" :label="field.label">
                    {{ field.value }}
                </InfoRow>
            </InfoGrid>
            <p v-else class="empty">Без подробностей</p>

            <DeleteConfirm label="Удалить событие" :deleting="deleting" @confirm="deleteEvent" />
        </template>

        <div v-else class="not-found">
            <p>Событие не найдено</p>
            <NuxtLink to="/">На главную</NuxtLink>
        </div>
    </AppPage>
</template>

<style scoped lang="scss">
.topbar-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: var(--tap-min);
    min-height: var(--tap-min);
    color: var(--color-text);
    text-decoration: none;
}

.head {
    display: flex;
    align-items: center;
    gap: var(--space-3);

    &__icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        color: var(--color-primary);
        flex-shrink: 0;
    }

    &__text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__title {
        font-size: var(--text-lg);
        font-weight: 700;
    }

    &__date {
        font-size: var(--text-sm);
        color: var(--color-text-muted);
    }
}

.empty {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
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
