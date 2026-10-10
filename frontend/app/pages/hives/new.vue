<script setup lang="ts">
useHead({ title: "Новый улей — Пасека" });

const db = useDb();
const { createHive } = useEntityWriter();

const label = ref("");
const defaultLabel = ref("Улей");
const type = ref("");
const frameCount = ref("");
const color = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const count = await db.hive
        .where("apiaryId")
        .equals(apiary.id)
        .filter((h) => !h.deletedAt)
        .count();

    defaultLabel.value = `Улей №${String(count + 1)}`;
    if (!label.value) label.value = defaultLabel.value;
});

async function submit(): Promise<void> {
    if (!label.value.trim()) return;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    submitting.value = true;
    error.value = null;

    try {
        await createHive(
            apiary.id,
            hiveFields({
                label: label.value,
                type: type.value,
                frameCount: frameCount.value,
                color: color.value,
                status: "active",
            }),
        );
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    await returnTo("/");
}
</script>

<template>
    <AppPage
        title="Новый улей"
        back-to="/">
        <form
            class="form"
            @submit.prevent="submit">
            <FormField
                v-slot="{ id }"
                label="Название"
                required>
                <BaseInput
                    :id="id"
                    v-model="label"
                    placeholder="Улей №1"
                    autocomplete="off"
                    autofocus
                    required />
            </FormField>

            <FormField
                v-slot="{ id }"
                label="Тип">
                <BaseSelect
                    :id="id"
                    v-model="type">
                    <option value="">Не указан</option>
                    <option
                        v-for="t in HIVE_TYPES"
                        :key="t.value"
                        :value="t.value">
                        {{ t.label }}
                    </option>
                </BaseSelect>
            </FormField>

            <FormField label="Цвет">
                <ColorPicker v-model="color" />
            </FormField>

            <FormField
                v-slot="{ id }"
                label="Вместимость (рамок)">
                <BaseInput
                    :id="id"
                    v-model="frameCount"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    placeholder="12" />
            </FormField>

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
}
</style>
