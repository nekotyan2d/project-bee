<script setup lang="ts">
import type { LocalHive } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { updateHive, deleteHive: removeHive } = useEntityWriter();

useHead({ title: "Редактировать улей — Пасека" });

const hive = ref<LocalHive | null>(null);
const label = ref("");
const type = ref("");
const frameCount = ref("");
const status = ref("active");
const color = ref("");
const { submitting, error, run } = useFormSubmit();
const deleting = ref(false);

onMounted(async () => {
    const h = await db.hive.get(id);
    if (!h) return;
    hive.value = h;
    label.value = h.label;
    type.value = h.type ?? "";
    frameCount.value = h.frameCount ? String(h.frameCount) : "";
    status.value = h.status;
    color.value = h.color ?? "";
});

async function submit(): Promise<void> {
    if (!label.value.trim() || !hive.value) return;

    const saved = await run(async () => {
        await updateHive(
            id,
            hiveFields({
                label: label.value,
                type: type.value,
                frameCount: frameCount.value,
                color: color.value,
                status: status.value,
            }),
        );
    });
    if (!saved) return;

    await returnTo(`/hives/${id}`);
}

async function deleteHive(): Promise<void> {
    if (!hive.value) return;
    deleting.value = true;

    await removeHive(id);

    await returnTo("/");
}
</script>

<template>
    <AppPage
        title="Редактировать улей"
        :back-to="`/hives/${id}`">
        <FormShell
            v-if="hive"
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

            <FormField label="Цвет">
                <ColorPicker v-model="color" />
            </FormField>

            <FormField
                v-slot="{ id: fid }"
                label="Вместимость (рамок)">
                <BaseInput
                    :id="fid"
                    v-model="frameCount"
                    type="number"
                    inputmode="numeric"
                    min="0"
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

            <template #footer>
                <DeleteConfirm
                    label="Удалить улей"
                    :deleting="deleting"
                    @confirm="deleteHive" />
            </template>
        </FormShell>

        <p
            v-else
            class="not-found">
            Улей не найден
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
