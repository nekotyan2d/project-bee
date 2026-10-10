<script setup lang="ts">
import type { LocalQueen } from "~/shared/db";
import type { QueenForm } from "~/utils/entityForms";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { updateQueen, deleteQueen: removeQueen } = useEntityWriter();

useHead({ title: "Редактировать матку — Пасека" });

const queen = ref<LocalQueen | null>(null);
const form = ref<QueenForm>(emptyQueenForm());
const { submitting, error, run } = useFormSubmit();
const deleting = ref(false);

onMounted(async () => {
    const q = await db.queen.get(id);
    if (!q) return;
    queen.value = q;
    form.value = queenToForm(q);
});

async function submit(): Promise<void> {
    if (!queen.value) return;

    const saved = await run(async () => {
        await updateQueen(id, queenFields(form.value));
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
            <QueenFormFields
                v-model="form"
                edit />

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
