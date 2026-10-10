<script setup lang="ts">
import type { LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { updateQueen, deleteQueen: removeQueen } = useEntityWriter();

useHead({ title: "Редактировать матку — Пасека" });

const queen = ref<LocalQueen | null>(null);
const year = ref("");
const breed = ref("");
const origin = ref("");
const introducedAt = ref("");
const status = ref("active");
const { submitting, error, run } = useFormSubmit();
const deleting = ref(false);

onMounted(async () => {
    const q = await db.queen.get(id);
    if (!q) return;
    queen.value = q;
    year.value = q.year ? String(q.year) : "";
    breed.value = q.breed ?? "";
    origin.value = q.origin ?? "";
    introducedAt.value = q.introducedAt ?? "";
    status.value = q.status;
});

async function submit(): Promise<void> {
    if (!queen.value) return;

    const saved = await run(async () => {
        await updateQueen(
            id,
            queenFields({
                year: year.value,
                breed: breed.value,
                origin: origin.value,
                introducedAt: introducedAt.value,
                status: status.value,
            }),
        );
    });
    if (!saved) return;

    await returnTo(`/queens/${id}`);
}

async function deleteQueen(): Promise<void> {
    if (!queen.value) return;
    deleting.value = true;

    const backTo = queen.value.colonyId ? `/colonies/${queen.value.colonyId}` : "/colonies";

    await removeQueen(id);

    await returnTo(backTo);
}
</script>

<template>
    <AppPage
        title="Редактировать матку"
        :back-to="`/queens/${id}`">
        <FormShell
            v-if="queen"
            :error="error"
            :submitting="submitting"
            @submit="submit">
            <FormField
                v-slot="{ id: fid }"
                label="Год вывода">
                <BaseInput
                    :id="fid"
                    v-model="year"
                    type="number"
                    inputmode="numeric"
                    :min="MIN_QUEEN_YEAR"
                    :max="MAX_QUEEN_YEAR"
                    placeholder="2024" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Порода">
                <BaseInput
                    :id="fid"
                    v-model="breed"
                    placeholder="Карника, бакфаст…"
                    autocomplete="off" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Происхождение">
                <BaseInput
                    :id="fid"
                    v-model="origin"
                    placeholder="Питомник, отводок…"
                    autocomplete="off" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Дата подсадки">
                <BaseInput
                    :id="fid"
                    v-model="introducedAt"
                    type="date" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Статус">
                <BaseSelect
                    :id="fid"
                    v-model="status">
                    <option value="active">Активна</option>
                    <option value="lost">Пропала</option>
                    <option value="died">Погибла</option>
                    <option value="replaced">Заменена</option>
                    <option value="superseded">Тихая замена</option>
                </BaseSelect>
            </FormField>

            <template #footer>
                <DeleteConfirm
                    label="Удалить матку"
                    :deleting="deleting"
                    @confirm="deleteQueen" />
            </template>
        </FormShell>

        <p
            v-else
            class="not-found">
            Матка не найдена
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
