<script setup lang="ts">
import type { LocalHive } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { enqueue } = useSync();

useHead({ title: "Редактировать улей — Пасека" });

const hive = ref<LocalHive | null>(null);
const label = ref("");
const type = ref("");
const frameCount = ref("");
const status = ref("active");
const submitting = ref(false);
const error = ref<string | null>(null);
const deleting = ref(false);

const HIVE_TYPES = [
    { value: "dadant", label: "Дадан" },
    { value: "rut", label: "Рут" },
    { value: "ukrainian", label: "Украинский" },
    { value: "multi_hull", label: "Многокорпусный" },
];

onMounted(async () => {
    const h = await db.hive.get(id);
    if (!h) return;
    hive.value = h;
    label.value = h.label;
    type.value = h.type ?? "";
    frameCount.value = h.frameCount ? String(h.frameCount) : "";
    status.value = h.status;
});

async function submit(): Promise<void> {
    const trimmedLabel = label.value.trim();
    if (!trimmedLabel || !hive.value) return;

    submitting.value = true;
    error.value = null;

    const now = new Date();
    const updates: Partial<LocalHive> = {
        label: trimmedLabel,
        type: type.value || undefined,
        frameCount: frameCount.value ? parseInt(frameCount.value, 10) : undefined,
        status: status.value,
        updatedAt: now,
    };

    try {
        await db.hive.update(id, updates);
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("hive", id, "upsert");

    await navigateTo(`/hives/${id}`);
}

async function deleteHive(): Promise<void> {
    if (!hive.value) return;
    deleting.value = true;

    const now = new Date();
    await db.hive.update(id, { deletedAt: now, updatedAt: now });

    void enqueue("hive", id, "delete");

    await navigateTo("/");
}
</script>

<template>
    <AppPage
        title="Редактировать улей"
        :back-to="`/hives/${id}`">
        <form
            v-if="hive"
            class="form"
            @submit.prevent="submit">
            <FormField
                v-slot="{ id: fid }"
                label="Название"
                required>
                <BaseInput
                    :id="fid"
                    v-model="label"
                    placeholder="Улей №1"
                    autocomplete="off"
                    required />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Тип">
                <BaseSelect
                    :id="fid"
                    v-model="type">
                    <option value="">Не указан</option>
                    <option
                        v-for="t in HIVE_TYPES"
                        :key="t.value"
                        :value="t.value">
                        {{ t.label }}
                    </option>
                </BaseSelect>
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Вместимость (рамок)">
                <BaseInput
                    :id="fid"
                    v-model="frameCount"
                    type="number"
                    placeholder="12" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Статус">
                <BaseSelect
                    :id="fid"
                    v-model="status">
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
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
                label="Удалить улей"
                :deleting="deleting"
                @confirm="deleteHive" />
        </form>

        <p
            v-else
            class="not-found">
            Улей не найден
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
