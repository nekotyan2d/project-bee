<script setup lang="ts">
import type { HiveForm } from "~/utils/entityForms";

useHead({ title: "Новый улей — Пасека" });

const db = useDb();
const { createHive } = useEntityWriter();

const form = ref<HiveForm>(emptyHiveForm());
const { submitting, error, run } = useFormSubmit();

onMounted(async () => {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const count = await db.hive
        .where("apiaryId")
        .equals(apiary.id)
        .filter((h) => !h.deletedAt)
        .count();

    if (!form.value.label) form.value.label = `Улей №${String(count + 1)}`;
});

async function submit(): Promise<void> {
    if (!form.value.label.trim()) return;

    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const saved = await run(async () => {
        await createHive(apiary.id, hiveFields(form.value));
    });
    if (!saved) return;

    await returnTo("/");
}
</script>

<template>
    <AppPage
        title="Новый улей"
        back-to="/">
        <FormShell
            :error="error"
            :submitting="submitting"
            @submit="submit">
            <HiveFormFields v-model="form" />
        </FormShell>
    </AppPage>
</template>
