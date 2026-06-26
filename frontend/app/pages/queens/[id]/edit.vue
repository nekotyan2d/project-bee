<script setup lang="ts">
import type { LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { enqueue } = useSync();

useHead({ title: "Редактировать матку — Пасека" });

const queen = ref<LocalQueen | null>(null);
const year = ref("");
const breed = ref("");
const origin = ref("");
const introducedAt = ref("");
const status = ref("active");
const submitting = ref(false);
const error = ref<string | null>(null);
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

    submitting.value = true;
    error.value = null;

    const now = new Date();
    const updates: Partial<LocalQueen> = {
        year: year.value ? parseInt(year.value, 10) : undefined,
        breed: breed.value.trim() || undefined,
        origin: origin.value.trim() || undefined,
        introducedAt: introducedAt.value || undefined,
        status: status.value,
        updatedAt: now,
    };

    try {
        await db.queen.update(id, updates);
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("queen", id, "upsert");

    await returnTo(`/queens/${id}`);
}

async function deleteQueen(): Promise<void> {
    if (!queen.value) return;
    deleting.value = true;

    const now = new Date();
    const backTo = queen.value.colonyId ? `/colonies/${queen.value.colonyId}` : "/colonies";

    await db.queen.update(id, { deletedAt: now, updatedAt: now });

    void enqueue("queen", id, "delete");

    await returnTo(backTo);
}
</script>

<template>
    <AppPage
        title="Редактировать матку"
        :back-to="`/queens/${id}`">
        <form
            v-if="queen"
            class="form"
            @submit.prevent="submit">
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

            <DeleteConfirm
                label="Удалить матку"
                :deleting="deleting"
                @confirm="deleteQueen" />
        </form>

        <p
            v-else
            class="not-found">
            Матка не найдена
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
