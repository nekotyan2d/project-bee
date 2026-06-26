<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { LocalEvent, LocalQueen } from "~/shared/db";

useHead({ title: "Новая матка — Пасека" });

const route = useRoute();
const colonyId = route.query.colonyId as string | undefined;

const db = useDb();
const { enqueue } = useSync();

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

    const now = new Date();

    const queen: LocalQueen = {
        id: uuidv7(),
        colonyId,
        year: year.value ? parseInt(year.value, 10) : undefined,
        breed: breed.value.trim() || undefined,
        origin: origin.value.trim() || undefined,
        introducedAt: introducedAt.value || undefined,
        status: "active",
        updatedAt: now,
    };

    const queenChangeEvent: LocalEvent | null = colonyId
        ? {
              id: uuidv7(),
              apiaryId: apiary.id,
              colonyId,
              type: "queen_change",
              occurredAt: now,
              payload: { action: "introduced", queenId: queen.id },
              updatedAt: now,
          }
        : null;

    try {
        await db.transaction("rw", db.queen, db.colony, db.event, async () => {
            await db.queen.add(queen);
            if (queenChangeEvent && colonyId) {
                await db.colony.update(colonyId, { currentQueenId: queen.id, updatedAt: now });
                await db.event.add(queenChangeEvent);
            }
        });
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("queen", queen.id, "upsert");
    if (queenChangeEvent) void enqueue("event", queenChangeEvent.id, "upsert");

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
