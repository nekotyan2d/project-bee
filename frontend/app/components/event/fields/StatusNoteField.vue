<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

defineProps<{
    field: "notes" | "cause";
    label: string;
    placeholder: string;
    hint: string;
}>();

const form = defineModel<EventForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        :label="label">
        <BaseTextarea
            :id="id"
            v-model="form[field]"
            :placeholder="placeholder" />
    </FormField>
    <FormHint>{{ hint }}</FormHint>
</template>
