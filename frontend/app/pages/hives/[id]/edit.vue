<script setup lang="ts">
import type { LocalHive } from "~/shared/db";
import type { HiveForm } from "~/utils/entityForms";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();
const { updateHive, deleteHive: removeHive } = useEntityWriter();

useHead({ title: "Редактировать улей — Пасека" });

const hive = ref<LocalHive | null>(null);
const form = ref<HiveForm>(emptyHiveForm());
const { submitting, error, run } = useFormSubmit();
const { show } = useToast();
const deleting = ref(false);
const occupied = ref(false);

const OCCUPIED_WARNING = "В улье живёт семья: она останется без улья, её можно будет заселить в другой.";

onMounted(async () => {
    const h = await db.hive.get(id);
    if (!h) return;
    hive.value = h;
    form.value = hiveToForm(h);
    occupied.value = (await db.colony.where("currentHiveId").equals(id).count()) > 0;
});

async function submit(): Promise<void> {
    if (!form.value.label.trim() || !hive.value) return;

    const saved = await run(async () => {
        await updateHive(id, hiveFields(form.value));
    }, "Изменения сохранены");
    if (!saved) return;

    await returnTo(`/hives/${id}`);
}

async function deleteHive(): Promise<void> {
    if (!hive.value) return;
    deleting.value = true;

    await removeHive(id);
    show("Улей удалён");

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
            <HiveFormFields
                v-model="form"
                edit />

            <template #footer>
                <DeleteConfirm
                    label="Удалить улей"
                    :deleting="deleting"
                    :warning="occupied ? OCCUPIED_WARNING : undefined"
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
