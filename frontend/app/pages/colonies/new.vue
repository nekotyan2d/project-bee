<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { LocalColony, LocalEvent, LocalHive, LocalQueen } from "~/shared/db";

const route = useRoute();
const settleHiveId = route.query.hiveId as string | undefined;

const db = useDb();
const { enqueue } = useSync();

const isSettle = computed(() => !!settleHiveId);
useHead({ title: isSettle.value ? "Заселить улей — Пасека" : "Новая семья — Пасека" });

// colony
const label = ref("");
const origin = ref("");
const establishedAt = ref("");

// hive (only when creating a new one)
const hiveLabel = ref("");
const hiveType = ref("");
const hiveFrames = ref("");
const hiveColor = ref("");
const defaultHiveLabel = ref("Улей");

// optional details, collapsed by default
const showDetails = ref(false);

// queen (optional)
const addQueen = ref(false);
const queenYear = ref("");
const queenBreed = ref("");

const submitting = ref(false);
const error = ref<string | null>(null);

const HIVE_TYPES = [
    { value: "dadant", label: "Дадан" },
    { value: "rut", label: "Рут" },
    { value: "ukrainian", label: "Украинский" },
    { value: "multi_hull", label: "Многокорпусный" },
];

// Автоимя улья «Улей №N» — поле остаётся редактируемым.
onMounted(async () => {
    if (isSettle.value) return;
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;
    const count = await db.hive
        .where("apiaryId")
        .equals(apiary.id)
        .filter((h) => !h.deletedAt)
        .count();
    defaultHiveLabel.value = `Улей №${String(count + 1)}`;
    if (!hiveLabel.value) hiveLabel.value = defaultHiveLabel.value;
});

async function submit(): Promise<void> {
    const trimmedLabel = label.value.trim();
    if (!trimmedLabel) return;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    submitting.value = true;
    error.value = null;

    const now = new Date();

    // hive: reuse the empty one we're settling into, or create a new one
    let hive: LocalHive | null = null;
    let hiveId = settleHiveId;
    if (!hiveId) {
        hive = {
            id: uuidv7(),
            apiaryId: apiary.id,
            label: hiveLabel.value.trim() || defaultHiveLabel.value,
            type: hiveType.value || undefined,
            frameCount: hiveFrames.value ? parseInt(hiveFrames.value, 10) : undefined,
            status: "active",
            color: hiveColor.value || undefined,
            updatedAt: now,
        };
        hiveId = hive.id;
    }

    const queen: LocalQueen | null = addQueen.value
        ? {
              id: uuidv7(),
              colonyId: undefined,
              year: queenYear.value ? parseInt(queenYear.value, 10) : undefined,
              breed: queenBreed.value.trim() || undefined,
              status: "active",
              updatedAt: now,
          }
        : null;

    const colony: LocalColony = {
        id: uuidv7(),
        apiaryId: apiary.id,
        label: trimmedLabel,
        establishedAt: establishedAt.value || undefined,
        origin: origin.value.trim() || undefined,
        status: "active",
        superCount: 0,
        currentHiveId: hiveId,
        currentQueenId: queen?.id,
        updatedAt: now,
    };
    if (queen) queen.colonyId = colony.id;

    const migrationEvent: LocalEvent = {
        id: uuidv7(),
        apiaryId: apiary.id,
        colonyId: colony.id,
        type: "migration",
        occurredAt: now,
        payload: { toHiveId: hiveId },
        updatedAt: now,
    };

    const queenChangeEvent: LocalEvent | null = queen
        ? {
              id: uuidv7(),
              apiaryId: apiary.id,
              colonyId: colony.id,
              type: "queen_change",
              occurredAt: now,
              payload: { action: "introduced", queenId: queen.id },
              updatedAt: now,
          }
        : null;

    try {
        await db.transaction("rw", db.hive, db.colony, db.queen, db.event, async () => {
            if (hive) await db.hive.add(hive);
            await db.colony.add(colony);
            await db.event.add(migrationEvent);
            if (queen) await db.queen.add(queen);
            if (queenChangeEvent) await db.event.add(queenChangeEvent);
        });
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    if (hive) void enqueue("hive", hive.id, "upsert");
    void enqueue("colony", colony.id, "upsert");
    if (queen) void enqueue("queen", queen.id, "upsert");
    void enqueue("event", migrationEvent.id, "upsert");
    if (queenChangeEvent) void enqueue("event", queenChangeEvent.id, "upsert");

    await navigateTo(`/colonies/${colony.id}`);
}
</script>

<template>
    <AppPage
        :title="isSettle ? 'Заселить улей' : 'Новая семья'"
        back-to="/">
        <form
            class="form"
            @submit.prevent="submit">
            <FormField
                v-slot="{ id }"
                label="Название семьи"
                required>
                <BaseInput
                    :id="id"
                    v-model="label"
                    placeholder="Семья №1"
                    autocomplete="off"
                    autofocus
                    required />
            </FormField>

            <FormField
                v-if="!isSettle"
                v-slot="{ id }"
                label="Улей">
                <BaseInput
                    :id="id"
                    v-model="hiveLabel"
                    placeholder="Улей №1"
                    autocomplete="off" />
            </FormField>

            <button
                type="button"
                class="disclosure"
                :class="{ 'disclosure--open': showDetails }"
                @click="showDetails = !showDetails">
                <Icon
                    name="lucide:sliders-horizontal"
                    size="18" />
                <span>Подробнее</span>
                <Icon
                    name="lucide:chevron-down"
                    size="18"
                    class="disclosure__chevron" />
            </button>

            <template v-if="showDetails">
                <template v-if="!isSettle">
                    <p class="group-title">Улей</p>
                    <FormField
                        v-slot="{ id }"
                        label="Тип улья">
                        <BaseSelect
                            :id="id"
                            v-model="hiveType">
                            <option value="">Не указан</option>
                            <option
                                v-for="t in HIVE_TYPES"
                                :key="t.value"
                                :value="t.value">
                                {{ t.label }}
                            </option>
                        </BaseSelect>
                    </FormField>
                    <FormField
                        v-slot="{ id }"
                        label="Вместимость (рамок)">
                        <BaseInput
                            :id="id"
                            v-model="hiveFrames"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            placeholder="12" />
                    </FormField>
                    <FormField label="Цвет улья">
                        <div class="color-picker">
                            <button
                                type="button"
                                class="color-swatch color-swatch--none"
                                :class="{ 'color-swatch--active': !hiveColor }"
                                @click="hiveColor = ''" />
                            <button
                                v-for="c in HIVE_COLORS"
                                :key="c.key"
                                type="button"
                                class="color-swatch"
                                :class="{ 'color-swatch--active': hiveColor === c.key }"
                                :style="{ background: c.hex }"
                                @click="hiveColor = c.key" />
                        </div>
                    </FormField>
                </template>

                <p class="group-title">Семья</p>
                <FormField
                    v-slot="{ id }"
                    label="Происхождение">
                    <BaseInput
                        :id="id"
                        v-model="origin"
                        placeholder="Рой, отводок, покупная…"
                        autocomplete="off" />
                </FormField>

                <FormField
                    v-slot="{ id }"
                    label="Дата основания">
                    <BaseInput
                        :id="id"
                        v-model="establishedAt"
                        type="date" />
                </FormField>
            </template>

            <button
                type="button"
                class="disclosure"
                :class="{ 'disclosure--open': addQueen }"
                @click="addQueen = !addQueen">
                <Icon
                    name="lucide:crown"
                    size="18" />
                <span>Добавить матку</span>
                <Icon
                    name="lucide:chevron-down"
                    size="18"
                    class="disclosure__chevron" />
            </button>

            <template v-if="addQueen">
                <FormField
                    v-slot="{ id }"
                    label="Год вывода матки">
                    <BaseInput
                        :id="id"
                        v-model="queenYear"
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
                        v-model="queenBreed"
                        placeholder="Карника, бакфаст…"
                        autocomplete="off" />
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
                {{ isSettle ? "Заселить" : "Создать" }}
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
}

.disclosure {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    background: none;
    color: var(--color-text);
    font-size: var(--text-base);
    font-weight: 500;
    font-family: var(--font-sans);
    cursor: pointer;

    &__chevron {
        margin-left: auto;
        color: var(--color-text-muted);
        transition: transform var(--transition-fast);
    }

    &--open &__chevron {
        transform: rotate(180deg);
    }
}

.group-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
}

.color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.color-swatch {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform var(--transition-fast);

    &--none {
        background: var(--color-border);
    }

    &--active {
        border-color: var(--color-text);
        transform: scale(1.15);
    }
}
</style>
