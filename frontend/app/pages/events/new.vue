<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { QueenAction } from "~/composables/useEventWriter";
import type { EventType, LocalEvent, LocalHive } from "~/shared/db";

const route = useRoute();
const eventId = route.query.eventId as string | undefined;
const isEdit = !!eventId;
const colonyId = ref(route.query.colonyId as string | undefined);
const type = ref(route.query.type as string | undefined);

const db = useDb();
const { saveEvent, saveQueenChange } = useEventWriter();

const baseTitle = computed(() => EVENT_FORM_TITLE[type.value ?? ""] ?? "Событие");
const pageTitle = computed(() => (isEdit ? `Изменить: ${baseTitle.value}` : baseTitle.value));
const backTo = computed(() => (isEdit ? `/events/${eventId}` : colonyId.value ? `/colonies/${colonyId.value}` : "/"));

useHead(() => ({ title: `${pageTitle.value} — Пасека` }));

// shared
const occurredAt = ref(toDatetimeLocal(new Date()));
const { submitting, error, run } = useFormSubmit();
const loading = ref(isEdit);

const f = reactive(emptyForm(type.value));

// super_change: delta выводится из действия и количества, а не вводится
const superAction = ref("add");
const superCount = ref("1");

const suggest = useEventHints(type, f, !isEdit);

// queen_change: поля новой матки, в payload не попадают
const queenAction = ref<QueenAction>("replaced");
const qcYear = ref("");
const qcBreed = ref("");
const queenNeedsNew = computed(() => QUEEN_SET_ACTIONS.has(queenAction.value));

const migrationHives = ref<LocalHive[]>([]);

function payload(): Record<string, unknown> {
    const p = buildPayload(type.value, f);
    if (type.value === "super_change") {
        const count = parseInt(superCount.value, 10) || 1;
        p.delta = superAction.value === "add" ? count : -count;
    }
    return p;
}

async function submit(): Promise<void> {
    if (!isEventFormValid(type.value, f, colonyId.value)) return;
    const cid = colonyId.value;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const now = new Date();
    const occurredAtDate = occurredAt.value ? new Date(occurredAt.value) : now;

    const saved = await run(async () => {
        if (type.value === "queen_change" && cid) {
            await saveQueenChange({
                apiaryId: apiary.id,
                colonyId: cid,
                occurredAt: occurredAtDate,
                action: queenAction.value,
                newQueen: queenNeedsNew.value
                    ? {
                          year: qcYear.value ? parseInt(qcYear.value, 10) : undefined,
                          breed: qcBreed.value.trim() || undefined,
                          introducedAt: occurredAt.value ? occurredAt.value.slice(0, 10) : undefined,
                      }
                    : undefined,
            });
        } else {
            await saveEvent(
                {
                    id: isEdit && eventId ? eventId : uuidv7(),
                    apiaryId: apiary.id,
                    colonyId: cid,
                    type: type.value as EventType,
                    occurredAt: occurredAtDate,
                    payload: payload(),
                    updatedAt: now,
                },
                isEdit,
            );
        }
    });
    if (!saved) return;

    await returnTo(backTo.value);
}

function prefillFromEvent(ev: LocalEvent): void {
    type.value = ev.type;
    colonyId.value = ev.colonyId ?? undefined;
    occurredAt.value = toDatetimeLocal(ev.occurredAt);
    Object.assign(f, formValues(ev.type, ev.payload));

    if (ev.type === "super_change") {
        const d = typeof ev.payload.delta === "number" ? ev.payload.delta : 0;
        superAction.value = d < 0 ? "remove" : "add";
        superCount.value = String(Math.abs(d) || 1);
    }
}

onMounted(async () => {
    if (eventId) {
        const ev = await db.event.get(eventId);
        // Правка поддержана только для editable-типов; иначе уводим на просмотр
        // (прямой заход по URL на edit, например, queen_change — иначе создал бы дубль).
        if (ev && !ev.deletedAt && !EDITABLE_EVENT_TYPES.includes(ev.type)) {
            await navigateTo(`/events/${eventId}`, { replace: true });
            return;
        }
        if (ev && !ev.deletedAt) prefillFromEvent(ev);
        loading.value = false;
    }

    if (type.value === "migration" && colonyId.value) {
        const colony = await db.colony.get(colonyId.value);
        if (colony) {
            migrationHives.value = await db.hive
                .where("apiaryId")
                .equals(colony.apiaryId)
                .filter((h) => !h.deletedAt && h.id !== colony.currentHiveId)
                .toArray();
        }
    }
});
</script>

<template>
    <AppPage
        :title="pageTitle"
        :back-to="backTo">
        <FormShell
            v-if="!loading"
            :error="error"
            :submitting="submitting"
            @submit="submit">
            <FormField
                v-slot="{ id }"
                label="Дата и время">
                <BaseInput
                    :id="id"
                    v-model="occurredAt"
                    type="datetime-local"
                    required />
            </FormField>

            <InspectionFields v-if="type === 'inspection'" :model-value="f" />

            <SuperChangeFields
                v-else-if="type === 'super_change'"
                v-model:action="superAction"
                v-model:count="superCount"
                :model-value="f"
                :suggest="suggest" />

            <TreatmentFields v-else-if="type === 'treatment'" :model-value="f" :suggest="suggest" />

            <FeedingFields v-else-if="type === 'feeding'" :model-value="f" :suggest="suggest" />

            <HarvestFields v-else-if="type === 'harvest'" :model-value="f" />

            <QueenChangeFields
                v-else-if="type === 'queen_change'"
                v-model:action="queenAction"
                v-model:year="qcYear"
                v-model:breed="qcBreed"
                :suggest="suggest" />

            <SwarmFields v-else-if="type === 'swarm'" :model-value="f" />

            <MigrationFields v-else-if="type === 'migration'" :model-value="f" :hives="migrationHives" />

            <SplitFields v-else-if="type === 'split'" :model-value="f" />

            <MergeFields v-else-if="type === 'merge'" :model-value="f" />

            <DeathFields v-else-if="type === 'death'" :model-value="f" />

            <FinanceFields v-else-if="type === 'finance'" :model-value="f" :suggest="suggest" />

            <NoteFields v-else-if="type === 'note'" :model-value="f" />
        </FormShell>
    </AppPage>
</template>
