<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { LocalHive } from "~/shared/db";

useHead({ title: "Новый улей — Пасека" });

const db = useDb();
const { enqueue } = useSync();

const label = ref("");
const type = ref("");
const frameCount = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);

const HIVE_TYPES = [
    { value: "dadant", label: "Дадан" },
    { value: "rut", label: "Рут" },
    { value: "ukrainian", label: "Украинский" },
    { value: "multi_hull", label: "Многокорпусный" },
];

async function submit(): Promise<void> {
    const trimmedLabel = label.value.trim();
    if (!trimmedLabel) return;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    submitting.value = true;
    error.value = null;

    const frames = frameCount.value ? parseInt(frameCount.value, 10) : undefined;

    const hive: LocalHive = {
        id: uuidv7(),
        apiaryId: apiary.id,
        label: trimmedLabel,
        type: type.value || undefined,
        frameCount: frames,
        status: "active",
        updatedAt: new Date(),
    };

    try {
        await db.hive.add(hive);
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("hive", hive.id, "upsert");

    await navigateTo("/");
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

            <FormField
                v-slot="{ id }"
                label="Вместимость (рамок)">
                <BaseInput
                    :id="id"
                    v-model="frameCount"
                    type="number"
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
