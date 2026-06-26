<script setup lang="ts">
import type { LocalColony } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { enqueue } = useSync();

useHead({ title: "Редактировать семью — Пасека" });

const colony = ref<LocalColony | null>(null);
const label = ref("");
const establishedAt = ref("");
const origin = ref("");
const status = ref("active");
const submitting = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
    const c = await db.colony.get(id);
    if (!c) return;
    colony.value = c;
    label.value = c.label;
    establishedAt.value = c.establishedAt ?? "";
    origin.value = c.origin ?? "";
    status.value = c.status;
});

async function submit(): Promise<void> {
    const trimmedLabel = label.value.trim();
    if (!trimmedLabel || !colony.value) return;

    submitting.value = true;
    error.value = null;

    const now = new Date();
    const updates: Partial<LocalColony> = {
        label: trimmedLabel,
        establishedAt: establishedAt.value || undefined,
        origin: origin.value.trim() || undefined,
        status: status.value,
        updatedAt: now,
    };

    try {
        await db.colony.update(id, updates);
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("colony", id, "upsert");

    await returnTo(`/colonies/${id}`);
}
</script>

<template>
    <AppPage
        title="Редактировать семью"
        :back-to="`/colonies/${id}`">
        <form
            v-if="colony"
            class="form"
            @submit.prevent="submit">
            <FormField
                v-slot="{ id: fid }"
                label="Название"
                required>
                <BaseInput
                    :id="fid"
                    v-model="label"
                    placeholder="Семья №1"
                    autocomplete="off"
                    required />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Дата основания">
                <BaseInput
                    :id="fid"
                    v-model="establishedAt"
                    type="date" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Происхождение">
                <BaseInput
                    :id="fid"
                    v-model="origin"
                    placeholder="Рой, отводок, покупная…"
                    autocomplete="off" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Статус">
                <BaseSelect
                    :id="fid"
                    v-model="status">
                    <option value="active">Активна</option>
                    <option value="dead">Погибла</option>
                    <option value="merged">Объединена</option>
                    <option value="split">Разделена</option>
                </BaseSelect>
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

        <p
            v-else
            class="not-found">
            Семья не найдена
        </p>
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

.not-found {
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-8) 0;
}
</style>
