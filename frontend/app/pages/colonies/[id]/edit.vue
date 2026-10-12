<script setup lang="ts">
import type { LocalColony } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { updateColony } = useEntityWriter();

useHead({ title: "Редактировать семью — Пасека" });

const colony = ref<LocalColony | null>(null);
const label = ref("");
const establishedAt = ref("");
const origin = ref("");
const status = ref("active");
const { submitting, error, run } = useFormSubmit();

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
    if (!label.value.trim() || !colony.value) return;

    const saved = await run(async () => {
        await updateColony(
            id,
            colonyFields({
                label: label.value,
                establishedAt: establishedAt.value,
                origin: origin.value,
                status: status.value,
            }),
        );
    }, "Изменения сохранены");
    if (!saved) return;

    await returnTo(`/colonies/${id}`);
}
</script>

<template>
    <AppPage
        title="Редактировать семью"
        :back-to="`/colonies/${id}`">
        <FormShell
            v-if="colony"
            :error="error"
            :submitting="submitting"
            @submit="submit">
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
        </FormShell>

        <p
            v-else
            class="not-found">
            Семья не найдена
        </p>
    </AppPage>
</template>

<style scoped lang="scss">
.not-found {
    color: var(--color-text-muted);
    text-align: center;
    padding: var(--space-8) 0;
}
</style>
