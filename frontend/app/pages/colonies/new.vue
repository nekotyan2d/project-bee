<script setup lang="ts">
const route = useRoute();
const settleHiveId = route.query.hiveId as string | undefined;

const db = useDb();
const { createColony } = useEntityWriter();

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
const defaultColonyLabel = ref("Семья");

// optional details, collapsed by default
const showDetails = ref(false);

// queen (optional)
const addQueen = ref(false);
const queenYear = ref("");
const queenBreed = ref("");

const submitting = ref(false);
const error = ref<string | null>(null);

// Автоимя улья «Улей №N» — поле остаётся редактируемым.
onMounted(async () => {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const colonyCount = await db.colony.where("apiaryId").equals(apiary.id).count();
    defaultColonyLabel.value = `Семья №${String(colonyCount + 1)}`;
    if (!label.value) label.value = defaultColonyLabel.value;

    if (isSettle.value) return;
    const hiveCount = await db.hive
        .where("apiaryId")
        .equals(apiary.id)
        .filter((h) => !h.deletedAt)
        .count();
    defaultHiveLabel.value = `Улей №${String(hiveCount + 1)}`;

    if (!hiveLabel.value) hiveLabel.value = defaultHiveLabel.value;
});

async function submit(): Promise<void> {
    if (!label.value.trim()) return;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    submitting.value = true;
    error.value = null;

    const hive = settleHiveId
        ? { existingId: settleHiveId }
        : {
              fields: hiveFields({
                  label: hiveLabel.value.trim() || defaultHiveLabel.value,
                  type: hiveType.value,
                  frameCount: hiveFrames.value,
                  color: hiveColor.value,
                  status: "active",
              }),
          };

    const q = queenFields({ ...emptyQueenForm(), year: queenYear.value, breed: queenBreed.value });

    let colonyId: string;
    try {
        colonyId = await createColony({
            apiaryId: apiary.id,
            colony: colonyFields({
                label: label.value,
                establishedAt: establishedAt.value,
                origin: origin.value,
                status: "active",
            }),
            hive,
            queen: addQueen.value ? { year: q.year, breed: q.breed } : undefined,
        });
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    await returnTo(`/colonies/${colonyId}`);
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
                        <ColorPicker v-model="hiveColor" />
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
</style>
