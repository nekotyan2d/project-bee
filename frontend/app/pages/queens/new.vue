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
const submitting = ref(false);
const error = ref<string | null>(null);

const backTo = colonyId ? `/colonies/${colonyId}` : "/colonies";

async function submit(): Promise<void> {
    const apiary = await db.apiary.orderBy("updatedAt").first();
    if (!apiary) return;

    submitting.value = true;
    error.value = null;

    try {
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
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    await returnTo(backTo);
}
</script>

<template>
    <AppPage
        title="Новая матка"
        :back-to="backTo">
        <form
            class="form"
            @submit.prevent="submit">
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
