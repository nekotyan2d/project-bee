<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { EventType, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";

const route = useRoute();
const eventId = route.query.eventId as string | undefined;
const isEdit = !!eventId;
const colonyId = ref(route.query.colonyId as string | undefined);
const type = ref(route.query.type as string | undefined);

const db = useDb();
const { enqueue } = useSync();

const TITLES: Record<string, string> = {
    inspection: "Осмотр",
    super_change: "Магазины",
    treatment: "Обработка",
    feeding: "Подкормка",
    harvest: "Откачка",
    queen_change: "Смена матки",
    swarm: "Роение",
    migration: "Переезд",
    split: "Деление",
    merge: "Объединение",
    death: "Гибель семьи",
    note: "Заметка",
};

const QC_NEEDS_QUEEN = ["introduced", "replaced", "superseded"];

const STATUS_BY_TYPE: Record<string, string> = { split: "split", merge: "merged", death: "dead" };

const baseTitle = computed(() => TITLES[type.value ?? ""] ?? "Событие");
const pageTitle = computed(() => (isEdit ? `Изменить: ${baseTitle.value}` : baseTitle.value));
const backTo = computed(() => (isEdit ? `/events/${eventId}` : colonyId.value ? `/colonies/${colonyId.value}` : "/"));

useHead(() => ({ title: `${pageTitle.value} — Пасека` }));

// shared
const occurredAt = ref(toDatetimeLocal(new Date()));
const submitting = ref(false);
const error = ref<string | null>(null);
const loading = ref(isEdit);

// inspection
const framesTotal = ref("");
const framesBrood = ref("");
const framesStores = ref("");
const queenSeen = ref("");
const queenCells = ref("");
const storesLevel = ref("");
const temperament = ref("");
const inspectionNotes = ref("");

// super_change
const superAction = ref("add");
const superCount = ref("1");
const superReason = ref("");

// chip option sets
const SUPER_ACTION_OPTS = [
    { value: "add", label: "Поставить" },
    { value: "remove", label: "Снять" },
];
const QUEEN_SEEN_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "true", label: "Видна" },
    { value: "false", label: "Не видна" },
];
const STORES_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "low", label: "Мало" },
    { value: "medium", label: "Достаточно" },
    { value: "high", label: "Много" },
];
const TEMPERAMENT_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "calm", label: "Спокойный" },
    { value: "nervous", label: "Нервный" },
    { value: "aggressive", label: "Агрессивный" },
];
const SWARM_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "true", label: "Поймали" },
    { value: "false", label: "Ушёл" },
];

// treatment
const treatProduct = ref("");
const treatDose = ref("");
const treatMethod = ref("");
const treatWithdrawalDays = ref("");

// feeding
const feedType = ref("");
const feedAmountKg = ref("");
const feedConcentration = ref("");

// harvest
const harvestProduct = ref("honey");
const harvestAmountKg = ref("");
const harvestFramesCount = ref("");
watch(harvestProduct, (v) => {
    if (v !== "honey") harvestFramesCount.value = "";
});

// queen_change
const queenAction = ref<"introduced" | "replaced" | "superseded" | "lost" | "died">("replaced");
const qcYear = ref("");
const qcBreed = ref("");
const queenNeedsNew = computed(() => QC_NEEDS_QUEEN.includes(queenAction.value));

// swarm
const swarmCaptured = ref("");
const swarmNotes = ref("");

// migration
const migrationToHive = ref("");
const migrationHives = ref<LocalHive[]>([]);

// split / merge / death
const splitNotes = ref("");
const mergeNotes = ref("");
const deathCause = ref("");

// note
const noteText = ref("");

function buildPayload(): Record<string, unknown> {
    switch (type.value) {
        case "inspection": {
            const p: Record<string, unknown> = {};
            if (framesTotal.value) p.framesTotal = parseInt(framesTotal.value, 10);
            if (framesBrood.value) p.framesBrood = parseInt(framesBrood.value, 10);
            if (framesStores.value) p.framesStores = parseInt(framesStores.value, 10);
            if (queenSeen.value !== "") p.queenSeen = queenSeen.value === "true";
            if (queenCells.value) p.queenCells = parseInt(queenCells.value, 10);
            if (storesLevel.value) p.storesLevel = storesLevel.value;
            if (temperament.value) p.temperament = temperament.value;
            if (inspectionNotes.value.trim()) p.notes = inspectionNotes.value.trim();
            return p;
        }
        case "super_change": {
            const count = parseInt(superCount.value, 10) || 1;
            const delta = superAction.value === "add" ? count : -count;
            const p: Record<string, unknown> = { delta };
            if (superReason.value.trim()) p.reason = superReason.value.trim();
            return p;
        }
        case "treatment": {
            const p: Record<string, unknown> = { product: treatProduct.value.trim() };
            if (treatDose.value.trim()) p.dose = treatDose.value.trim();
            if (treatMethod.value.trim()) p.method = treatMethod.value.trim();
            if (treatWithdrawalDays.value) p.withdrawalDays = parseInt(treatWithdrawalDays.value, 10);
            return p;
        }
        case "feeding": {
            const p: Record<string, unknown> = { feedType: feedType.value };
            if (feedAmountKg.value) p.amountKg = parseFloat(feedAmountKg.value);
            if (feedConcentration.value.trim()) p.concentration = feedConcentration.value.trim();
            return p;
        }
        case "harvest": {
            const p: Record<string, unknown> = {};
            if (harvestAmountKg.value) p.amountKg = parseFloat(harvestAmountKg.value);
            if (harvestFramesCount.value) p.framesCount = parseFloat(harvestFramesCount.value);
            if (harvestProduct.value) p.product = harvestProduct.value;
            return p;
        }
        case "swarm": {
            const p: Record<string, unknown> = {};
            if (swarmCaptured.value !== "") p.captured = swarmCaptured.value === "true";
            if (swarmNotes.value.trim()) p.notes = swarmNotes.value.trim();
            return p;
        }
        case "migration":
            return { toHiveId: migrationToHive.value };
        case "split": {
            const p: Record<string, unknown> = {};
            if (splitNotes.value.trim()) p.notes = splitNotes.value.trim();
            return p;
        }
        case "merge": {
            const p: Record<string, unknown> = {};
            if (mergeNotes.value.trim()) p.notes = mergeNotes.value.trim();
            return p;
        }
        case "death": {
            const p: Record<string, unknown> = {};
            if (deathCause.value.trim()) p.cause = deathCause.value.trim();
            return p;
        }
        case "note":
            return { text: noteText.value.trim() };
        default:
            return {};
    }
}

function isValid(): boolean {
    if (!type.value) return false;
    if (!colonyId.value && type.value !== "note" && type.value !== "harvest") return false;
    if (type.value === "treatment" && !treatProduct.value.trim()) return false;
    if (type.value === "feeding" && !feedType.value) return false;
    if (type.value === "harvest" && !harvestAmountKg.value && !harvestFramesCount.value) return false;
    if (type.value === "migration" && !migrationToHive.value) return false;
    if (type.value === "note" && !noteText.value.trim()) return false;
    return true;
}

async function submitQueenChange(apiaryId: string, cid: string, occurredAtDate: Date, now: Date): Promise<void> {
    const action = queenAction.value;
    const needsQueen = queenNeedsNew.value;

    const colony = await db.colony.get(cid);
    const prevQueenId = colony?.currentQueenId;
    const prevQueen = prevQueenId && action !== "introduced" ? await db.queen.get(prevQueenId) : undefined;

    const newQueen: LocalQueen | null = needsQueen
        ? {
              id: uuidv7(),
              colonyId: cid,
              year: qcYear.value ? parseInt(qcYear.value, 10) : undefined,
              breed: qcBreed.value.trim() || undefined,
              introducedAt: occurredAt.value ? occurredAt.value.slice(0, 10) : undefined,
              status: "active",
              updatedAt: now,
          }
        : null;

    const payload = newQueen ? { action, queenId: newQueen.id } : { action };
    const event: LocalEvent = {
        id: uuidv7(),
        apiaryId,
        colonyId: cid,
        type: "queen_change",
        occurredAt: occurredAtDate,
        payload,
        updatedAt: now,
    };

    try {
        await db.transaction("rw", db.event, db.colony, db.queen, async () => {
            if (newQueen) await db.queen.add(newQueen);
            await db.event.add(event);
            if (prevQueen) await db.queen.update(prevQueen.id, { status: action, updatedAt: now });
            if (colony) {
                if (newQueen) colony.currentQueenId = newQueen.id;
                else delete colony.currentQueenId;
                colony.updatedAt = now;
                await db.colony.put(colony);
            }
        });
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    if (newQueen) void enqueue("queen", newQueen.id, "upsert");
    if (prevQueen) void enqueue("queen", prevQueen.id, "upsert");
    void enqueue("event", event.id, "upsert");

    await returnTo(backTo.value);
}

async function submit(): Promise<void> {
    if (!isValid()) return;
    const cid = colonyId.value;

    submitting.value = true;
    error.value = null;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) {
        submitting.value = false;
        return;
    }

    const now = new Date();
    const occurredAtDate = occurredAt.value ? new Date(occurredAt.value) : now;

    if (type.value === "queen_change" && cid) {
        await submitQueenChange(apiary.id, cid, occurredAtDate, now);
        return;
    }

    const event: LocalEvent = {
        id: isEdit && eventId ? eventId : uuidv7(),
        apiaryId: apiary.id,
        colonyId: cid,
        type: type.value as EventType,
        occurredAt: occurredAtDate,
        payload: buildPayload(),
        updatedAt: now,
    };

    try {
        await db.transaction("rw", db.event, db.colony, async () => {
            if (isEdit) await db.event.put(event);
            else await db.event.add(event);

            const colony = cid ? await db.colony.get(cid) : undefined;
            if (colony) {
                const events = await db.event.where("colonyId").equals(cid as string).toArray();
                const st = deriveColonyState(events);
                colony.superCount = st.superCount;
                if (st.lastInspectedAt) colony.lastInspectedAt = st.lastInspectedAt;
                else delete colony.lastInspectedAt;
                if (st.currentHiveId) colony.currentHiveId = st.currentHiveId;
                else delete colony.currentHiveId;
                if (st.currentQueenId) colony.currentQueenId = st.currentQueenId;
                else delete colony.currentQueenId;
                const newStatus = STATUS_BY_TYPE[type.value ?? ""];
                if (newStatus) colony.status = newStatus;
                colony.updatedAt = now;
                await db.colony.put(colony);
            }
        });
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("event", event.id, "upsert");
    if (cid && STATUS_BY_TYPE[type.value ?? ""]) void enqueue("colony", cid, "upsert");

    await returnTo(backTo.value);
}

function prefillFromEvent(ev: LocalEvent): void {
    type.value = ev.type;
    colonyId.value = ev.colonyId;
    occurredAt.value = toDatetimeLocal(ev.occurredAt);

    const p = ev.payload;
    const numStr = (v: unknown): string => (typeof v === "number" ? String(v) : "");
    const strVal = (v: unknown): string => (typeof v === "string" ? v : "");

    switch (ev.type) {
        case "inspection":
            framesTotal.value = numStr(p.framesTotal);
            framesBrood.value = numStr(p.framesBrood);
            framesStores.value = numStr(p.framesStores);
            queenCells.value = numStr(p.queenCells);
            queenSeen.value = p.queenSeen === true ? "true" : p.queenSeen === false ? "false" : "";
            storesLevel.value = strVal(p.storesLevel);
            temperament.value = strVal(p.temperament);
            inspectionNotes.value = strVal(p.notes);
            break;
        case "super_change": {
            const d = typeof p.delta === "number" ? p.delta : 0;
            superAction.value = d < 0 ? "remove" : "add";
            superCount.value = String(Math.abs(d) || 1);
            superReason.value = strVal(p.reason);
            break;
        }
        case "treatment":
            treatProduct.value = strVal(p.product);
            treatDose.value = strVal(p.dose);
            treatMethod.value = strVal(p.method);
            treatWithdrawalDays.value = numStr(p.withdrawalDays);
            break;
        case "feeding":
            feedType.value = strVal(p.feedType);
            feedAmountKg.value = numStr(p.amountKg);
            feedConcentration.value = strVal(p.concentration);
            break;
        case "harvest":
            harvestProduct.value = strVal(p.product) || "honey";
            harvestAmountKg.value = numStr(p.amountKg);
            harvestFramesCount.value = numStr(p.framesCount);
            break;
        case "swarm":
            swarmCaptured.value = p.captured === true ? "true" : p.captured === false ? "false" : "";
            swarmNotes.value = strVal(p.notes);
            break;
        case "note":
            noteText.value = strVal(p.text);
            break;
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
        <form
            v-if="!loading"
            class="form"
            @submit.prevent="submit">
            <FormField
                v-slot="{ id }"
                label="Дата и время">
                <BaseInput
                    :id="id"
                    v-model="occurredAt"
                    type="datetime-local"
                    required />
            </FormField>

            <template v-if="type === 'inspection'">
                <div class="grid-2">
                    <FormField
                        v-slot="{ id }"
                        label="Рамок в гнезде">
                        <BaseInput
                            :id="id"
                            v-model="framesTotal"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="0" />
                    </FormField>
                    <FormField
                        v-slot="{ id }"
                        label="Рамок расплода">
                        <BaseInput
                            :id="id"
                            v-model="framesBrood"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="0" />
                    </FormField>
                    <FormField
                        v-slot="{ id }"
                        label="Рамок корма">
                        <BaseInput
                            :id="id"
                            v-model="framesStores"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="0" />
                    </FormField>
                    <FormField
                        v-slot="{ id }"
                        label="Маточники">
                        <BaseInput
                            :id="id"
                            v-model="queenCells"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="0" />
                    </FormField>
                </div>
                <FormField label="Матка">
                    <ChoiceChips
                        v-model="queenSeen"
                        :options="QUEEN_SEEN_OPTS" />
                </FormField>
                <FormField label="Запасы">
                    <ChoiceChips
                        v-model="storesLevel"
                        :options="STORES_OPTS" />
                </FormField>
                <FormField label="Нрав">
                    <ChoiceChips
                        v-model="temperament"
                        :options="TEMPERAMENT_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="inspectionNotes"
                        placeholder="Наблюдения…" />
                </FormField>
            </template>

            <template v-else-if="type === 'super_change'">
                <FormField label="Действие">
                    <ChoiceChips
                        v-model="superAction"
                        :options="SUPER_ACTION_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Количество">
                    <BaseInput
                        :id="id"
                        v-model="superCount"
                        type="number"
                        inputmode="numeric"
                        min="1"
                        placeholder="1" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Причина">
                    <BaseInput
                        :id="id"
                        v-model="superReason"
                        placeholder="Взяток начался…"
                        autocomplete="off" />
                </FormField>
            </template>

            <template v-else-if="type === 'treatment'">
                <FormField
                    v-slot="{ id }"
                    label="Препарат"
                    required>
                    <BaseInput
                        :id="id"
                        v-model="treatProduct"
                        placeholder="Бипин, Апитрит…"
                        autocomplete="off"
                        required />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Дозировка">
                    <BaseInput
                        :id="id"
                        v-model="treatDose"
                        placeholder="1 мл на улочку"
                        autocomplete="off" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Способ">
                    <BaseInput
                        :id="id"
                        v-model="treatMethod"
                        placeholder="Обработка парами…"
                        autocomplete="off" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Срок ожидания (дней)">
                    <BaseInput
                        :id="id"
                        v-model="treatWithdrawalDays"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        placeholder="0" />
                </FormField>
            </template>

            <template v-else-if="type === 'feeding'">
                <FormField
                    v-slot="{ id }"
                    label="Тип корма"
                    required>
                    <BaseSelect
                        :id="id"
                        v-model="feedType"
                        required>
                        <option value="">Выберите тип</option>
                        <option value="syrup">Сироп</option>
                        <option value="candy">Канди</option>
                        <option value="honey">Мёд</option>
                        <option value="pollen_substitute">Белковый корм</option>
                        <option value="water">Вода</option>
                    </BaseSelect>
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Количество (кг)">
                    <BaseInput
                        :id="id"
                        v-model="feedAmountKg"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        step="0.1"
                        placeholder="0" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Концентрация">
                    <BaseInput
                        :id="id"
                        v-model="feedConcentration"
                        placeholder="1:1, 50%…"
                        autocomplete="off" />
                </FormField>
            </template>

            <template v-else-if="type === 'harvest'">
                <FormField
                    v-slot="{ id }"
                    label="Продукт">
                    <BaseSelect
                        :id="id"
                        v-model="harvestProduct">
                        <option value="honey">Мёд</option>
                        <option value="wax">Воск</option>
                        <option value="propolis">Прополис</option>
                        <option value="pollen">Пыльца</option>
                    </BaseSelect>
                </FormField>
                <div :class="harvestProduct === 'honey' ? 'grid-2' : undefined">
                    <FormField
                        v-slot="{ id }"
                        label="Количество (кг)">
                        <BaseInput
                            :id="id"
                            v-model="harvestAmountKg"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="0.1"
                            placeholder="0" />
                    </FormField>
                    <FormField
                        v-if="harvestProduct === 'honey'"
                        v-slot="{ id }"
                        label="Рамок (шт.)">
                        <BaseInput
                            :id="id"
                            v-model="harvestFramesCount"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="0.5"
                            placeholder="0" />
                    </FormField>
                </div>
            </template>

            <template v-else-if="type === 'queen_change'">
                <FormField
                    v-slot="{ id }"
                    label="Что произошло">
                    <BaseSelect
                        :id="id"
                        v-model="queenAction">
                        <option value="introduced">Подсадил новую матку</option>
                        <option value="replaced">Заменил матку</option>
                        <option value="superseded">Тихая смена</option>
                        <option value="lost">Матка потеряна</option>
                        <option value="died">Матка погибла</option>
                    </BaseSelect>
                </FormField>
                <template v-if="queenNeedsNew">
                    <FormField
                        v-slot="{ id }"
                        label="Год вывода матки">
                        <BaseInput
                            :id="id"
                            v-model="qcYear"
                            type="number"
                            inputmode="numeric"
                            :min="MIN_QUEEN_YEAR"
                            :max="MAX_QUEEN_YEAR"
                            placeholder="2024" />
                    </FormField>
                    <FormField
                        v-slot="{ id }"
                        label="Порода">
                        <BaseInput
                            :id="id"
                            v-model="qcBreed"
                            placeholder="Карника, бакфаст…"
                            autocomplete="off" />
                    </FormField>
                </template>
            </template>

            <template v-else-if="type === 'swarm'">
                <FormField label="Рой пойман?">
                    <ChoiceChips
                        v-model="swarmCaptured"
                        :options="SWARM_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="swarmNotes"
                        placeholder="Наблюдения…" />
                </FormField>
            </template>

            <template v-else-if="type === 'migration'">
                <FormField
                    v-slot="{ id }"
                    label="В какой улей"
                    required>
                    <BaseSelect
                        :id="id"
                        v-model="migrationToHive"
                        required>
                        <option value="">Выберите улей</option>
                        <option
                            v-for="h in migrationHives"
                            :key="h.id"
                            :value="h.id">
                            {{ h.label }}
                        </option>
                    </BaseSelect>
                </FormField>
                <p
                    v-if="migrationHives.length === 0"
                    class="form__hint">
                    Нет других ульев на пасеке.
                </p>
            </template>

            <template v-else-if="type === 'split'">
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="splitNotes"
                        placeholder="Что отделили, куда…" />
                </FormField>
                <p class="form__hint">Семья будет помечена как «разделена».</p>
            </template>

            <template v-else-if="type === 'merge'">
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="mergeNotes"
                        placeholder="С кем объединили…" />
                </FormField>
                <p class="form__hint">Семья будет помечена как «объединена».</p>
            </template>

            <template v-else-if="type === 'death'">
                <FormField
                    v-slot="{ id }"
                    label="Причина">
                    <BaseTextarea
                        :id="id"
                        v-model="deathCause"
                        placeholder="Слёт, болезнь, бескормица…" />
                </FormField>
                <p class="form__hint">Семья будет помечена как «погибла».</p>
            </template>

            <template v-else-if="type === 'note'">
                <FormField
                    v-slot="{ id }"
                    label="Заметка"
                    required>
                    <BaseTextarea
                        :id="id"
                        v-model="noteText"
                        placeholder="Текст заметки…"
                        :rows="6"
                        required />
                </FormField>
            </template>

            <p
                v-if="error"
                class="form__error">
                {{ error }}
            </p>

            <BaseButton
                type="submit"
                :loading="submitting"
                block>
                Сохранить
            </BaseButton>
        </form>
    </AppPage>
</template>

<style scoped lang="scss">
.form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    &__error {
        color: var(--color-danger);
        font-size: var(--text-sm);
    }

    &__hint {
        color: var(--color-text-muted);
        font-size: var(--text-sm);
    }
}

.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
}
</style>
