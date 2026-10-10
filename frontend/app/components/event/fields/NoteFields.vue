<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Заметка"
        required>
        <BaseTextarea
            :id="id"
            v-model="form.text"
            placeholder="Текст заметки…"
            :rows="6"
            required />
    </FormField>
</template>
