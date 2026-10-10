<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { SuggestOption } from "~/components/ui/SuggestInput.vue";
import type { EventType, LocalEvent, LocalHive } from "~/shared/db";
import { type HistoryItem, suggestions } from "~/utils/suggestions";

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
const submitting = ref(false);
const error = ref<string | null>(null);
const loading = ref(isEdit);

const f = reactive(emptyForm(type.value));

// super_change: delta выводится из действия и количества, а не вводится
const superAction = ref("add");
const superCount = ref("1");
watch(
    () => f.product,
    (v) => {
        if (type.value === "harvest" && v !== "honey") f.framesCount = "";
    },
);

const history = shallowRef<HistoryItem[]>([]);
onMounted(async () => {
    if (!type.value || isEdit) return;
    if (type.value === "queen_change") {
        const queens = await db.queen.filter((q) => !q.deletedAt).toArray();
        history.value = queens.map((q) => ({ occurredAt: new Date(0), payload: { breed: q.breed } }));
        return;
    }
    const events = await db.event
        .where("type")
        .equals(type.value)
        .filter((e) => !e.deletedAt)
        .toArray();
    history.value = events;
});

interface HintOpts {
    fill?: string[];
    hint?: string[];
    where?: (payload: Record<string, unknown>) => boolean;
}

const TREATMENT_OPTS: HintOpts = { fill: ["dose", "method", "withdrawalDays"], hint: ["dose", "method"] };
const financeOpts = (): HintOpts => ({
    fill: ["counterparty"],
    hint: ["counterparty"],
    where: (p) => p.direction === f.direction,
});

function suggest(field: string, o: HintOpts) {
    const rows = o.where ? history.value.filter((e) => o.where?.(e.payload)) : history.value;
    return suggestions(rows, field, o.fill);
}

function hints(field: string, o: HintOpts = {}): SuggestOption[] {
    return suggest(field, o).map((s) => ({
        value: s.value,
        hint:
            (o.hint ?? [])
                .map((k) => s.fill[k])
                .filter(Boolean)
                .join(" · ") || undefined,
    }));
}

function fillFrom(field: string, value: string, o: HintOpts) {
    const found = suggest(field, o).find((s) => s.value === value.trim());
    if (!found) return;
    for (const [k, v] of Object.entries(found.fill)) {
        if (!f[k as keyof EventForm]) f[k as keyof EventForm] = v;
    }
}

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
const FINANCE_DIRECTION_OPTS = [
    { value: "expense", label: "Покупка" },
    { value: "income", label: "Продажа" },
];
const SWARM_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "true", label: "Поймали" },
    { value: "false", label: "Ушёл" },
];

// queen_change: поля новой матки, в payload не попадают
const queenAction = ref<"introduced" | "replaced" | "superseded" | "lost" | "died">("replaced");
const qcYear = ref("");
const qcBreed = ref("");
const queenNeedsNew = computed(() => QUEEN_SET_ACTIONS.has(queenAction.value));

const financeCategories = computed(() =>
    f.direction === "income" ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES,
);
watch(
    () => f.direction,
    () => {
        if (type.value === "finance" && !financeCategories.value.includes(String(f.category))) {
            f.category = financeCategories.value[0] ?? "other";
        }
    },
);

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

    submitting.value = true;
    error.value = null;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) {
        submitting.value = false;
        return;
    }

    const now = new Date();
    const occurredAtDate = occurredAt.value ? new Date(occurredAt.value) : now;

    try {
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
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

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
                            v-model="f.framesTotal"
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
                            v-model="f.framesBrood"
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
                            v-model="f.framesStores"
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
                            v-model="f.queenCells"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="0" />
                    </FormField>
                </div>
                <FormField label="Матка">
                    <ChoiceChips
                        v-model="f.queenSeen"
                        :options="QUEEN_SEEN_OPTS" />
                </FormField>
                <FormField label="Запасы">
                    <ChoiceChips
                        v-model="f.storesLevel"
                        :options="STORES_OPTS" />
                </FormField>
                <FormField label="Нрав">
                    <ChoiceChips
                        v-model="f.temperament"
                        :options="TEMPERAMENT_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="f.notes"
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
                    <SuggestInput
                        :id="id"
                        v-model="f.reason"
                        :options="hints('reason')"
                        placeholder="Взяток начался…"
                        autocomplete="off" />
                </FormField>
            </template>

            <template v-else-if="type === 'treatment'">
                <FormField
                    v-slot="{ id }"
                    label="Препарат"
                    required>
                    <SuggestInput
                        :id="id"
                        v-model="f.product"
                        :options="hints('product', TREATMENT_OPTS)"
                        placeholder="Бипин, Апитрит…"
                        autocomplete="off"
                        required
                        @commit="fillFrom('product', $event, TREATMENT_OPTS)" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Дозировка">
                    <SuggestInput
                        :id="id"
                        v-model="f.dose"
                        :options="hints('dose')"
                        placeholder="1 мл на улочку"
                        autocomplete="off" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Способ">
                    <SuggestInput
                        :id="id"
                        v-model="f.method"
                        :options="hints('method')"
                        placeholder="Обработка парами…"
                        autocomplete="off" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Срок ожидания (дней)">
                    <BaseInput
                        :id="id"
                        v-model="f.withdrawalDays"
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
                        v-model="f.feedType"
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
                    label="Количество (л)">
                    <BaseInput
                        :id="id"
                        v-model="f.amountKg"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        step="0.1"
                        placeholder="0" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Концентрация">
                    <SuggestInput
                        :id="id"
                        v-model="f.concentration"
                        :options="hints('concentration')"
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
                        v-model="f.product">
                        <option value="honey">Мёд</option>
                        <option value="wax">Воск</option>
                        <option value="propolis">Прополис</option>
                        <option value="pollen">Пыльца</option>
                    </BaseSelect>
                </FormField>
                <div :class="f.product === 'honey' ? 'grid-2' : undefined">
                    <FormField
                        v-slot="{ id }"
                        :label="`Количество (${harvestUnit(f.product)})`">
                        <BaseInput
                            :id="id"
                            v-model="f.amountKg"
                            type="number"
                            inputmode="decimal"
                            min="0"
                            step="0.1"
                            placeholder="0" />
                    </FormField>
                    <FormField
                        v-if="f.product === 'honey'"
                        v-slot="{ id }"
                        label="Рамок (шт.)">
                        <BaseInput
                            :id="id"
                            v-model="f.framesCount"
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
                        <SuggestInput
                            :id="id"
                            v-model="qcBreed"
                            :options="hints('breed')"
                            placeholder="Карника, бакфаст…"
                            autocomplete="off" />
                    </FormField>
                </template>
            </template>

            <template v-else-if="type === 'swarm'">
                <FormField label="Рой пойман?">
                    <ChoiceChips
                        v-model="f.captured"
                        :options="SWARM_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="f.notes"
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
                        v-model="f.toHiveId"
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
                        v-model="f.notes"
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
                        v-model="f.notes"
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
                        v-model="f.cause"
                        placeholder="Слёт, болезнь, бескормица…" />
                </FormField>
                <p class="form__hint">Семья будет помечена как «погибла».</p>
            </template>

            <template v-else-if="type === 'finance'">
                <FormField label="Операция">
                    <ChoiceChips
                        v-model="f.direction"
                        :options="FINANCE_DIRECTION_OPTS" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Сумма"
                    required>
                    <BaseInput
                        :id="id"
                        v-model="f.amount"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        required />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Категория">
                    <BaseSelect
                        :id="id"
                        v-model="f.category">
                        <option
                            v-for="c in financeCategories"
                            :key="c"
                            :value="c">
                            {{ FINANCE_CATEGORY_LABEL[c] }}
                        </option>
                    </BaseSelect>
                </FormField>
                <FormField
                    v-slot="{ id }"
                    :label="f.direction === 'income' ? 'Что продано' : 'Что куплено'">
                    <SuggestInput
                        :id="id"
                        v-model="f.item"
                        :options="hints('item', financeOpts())"
                        placeholder="Мёд, 50 кг"
                        autocomplete="off"
                        @commit="fillFrom('item', $event, financeOpts())" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    :label="f.direction === 'income' ? 'Покупатель' : 'Продавец'">
                    <SuggestInput
                        :id="id"
                        v-model="f.counterparty"
                        :options="hints('counterparty', { where: financeOpts().where })"
                        placeholder="Имя или магазин"
                        autocomplete="off" />
                </FormField>
                <FormField
                    v-slot="{ id }"
                    label="Заметки">
                    <BaseTextarea
                        :id="id"
                        v-model="f.notes"
                        placeholder="Условия, доставка…" />
                </FormField>
            </template>

            <template v-else-if="type === 'note'">
                <FormField
                    v-slot="{ id }"
                    label="Заметка"
                    required>
                    <BaseTextarea
                        :id="id"
                        v-model="f.text"
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
