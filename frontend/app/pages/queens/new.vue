<script setup lang="ts">
import type { QueenForm } from "~/utils/entityForms";

useHead({ title: "Новая матка — Пасека" });

const route = useRoute();
const colonyId = route.query.colonyId as string | undefined;

const db = useDb();
const { createQueen } = useEntityWriter();

const form = ref<QueenForm>(emptyQueenForm());
const { submitting, error, run } = useFormSubmit();

const backTo = colonyId ? `/colonies/${colonyId}` : "/colonies";

async function submit(): Promise<void> {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const saved = await run(async () => {
        await createQueen(apiary.id, queenFields(form.value), colonyId);
    });
    if (!saved) return;

    await returnTo(backTo);
}
</script>

<template>
    <AppPage
        title="Новая матка"
        :back-to="backTo">
        <FormShell
            :error="error"
            :submitting="submitting"
            @submit="submit">
            <QueenFormFields v-model="form" />
        </FormShell>
    </AppPage>
</template>
