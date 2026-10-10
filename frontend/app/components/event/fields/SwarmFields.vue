<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const CAPTURED_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "true", label: "Поймали" },
    { value: "false", label: "Ушёл" },
];

const form = defineModel<EventForm>({ required: true });
</script>

<template>
    <FormField label="Рой пойман?">
        <ChoiceChips
            v-model="form.captured"
            :options="CAPTURED_OPTS" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Заметки">
        <BaseTextarea
            :id="id"
            v-model="form.notes"
            placeholder="Наблюдения…" />
    </FormField>
</template>
