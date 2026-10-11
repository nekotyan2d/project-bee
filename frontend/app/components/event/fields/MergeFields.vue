<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Заметки">
        <BaseTextarea
            :id="id"
            v-model="form.notes"
            placeholder="С кем объединили…" />
    </FormField>
    <FormHint>Семья будет помечена как «объединена».</FormHint>
</template>
