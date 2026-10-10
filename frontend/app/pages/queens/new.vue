<script setup lang="ts">
useHead({ title: "Новая матка — Пасека" });

const route = useRoute();
const colonyId = route.query.colonyId as string | undefined;

const db = useDb();
const { createQueen } = useEntityWriter();

const year = ref("");
const breed = ref("");
const origin = ref("");
const introducedAt = ref("");
const { submitting, error, run } = useFormSubmit();

const backTo = colonyId ? `/colonies/${colonyId}` : "/colonies";

async function submit(): Promise<void> {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    const saved = await run(async () => {
        await createQueen(
            apiary.id,
            queenFields({
                year: year.value,
                breed: breed.value,
                origin: origin.value,
                introducedAt: introducedAt.value,
                status: "active",
            }),
            colonyId,
        );
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
            <FormField
                v-slot="{ id }"
                label="Год вывода">
                <BaseInput
                    :id="id"
                    v-model="year"
                    type="number"
                    inputmode="numeric"
                    :min="MIN_QUEEN_YEAR"
                    :max="MAX_QUEEN_YEAR"
                    placeholder="2024"
                    autofocus />
            </FormField>

            <FormField
                v-slot="{ id }"
                label="Порода">
                <BaseInput
                    :id="id"
                    v-model="breed"
                    placeholder="Карника, бакфаст…"
                    autocomplete="off" />
            </FormField>

            <FormField
                v-slot="{ id }"
                label="Происхождение">
                <BaseInput
                    :id="id"
                    v-model="origin"
                    placeholder="Питомник, отводок…"
                    autocomplete="off" />
            </FormField>

            <FormField
                v-slot="{ id }"
                label="Дата подсадки">
                <BaseInput
                    :id="id"
                    v-model="introducedAt"
                    type="date" />
            </FormField>
        </FormShell>
    </AppPage>
</template>
