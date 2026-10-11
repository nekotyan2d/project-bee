<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Причина">
        <BaseTextarea
            :id="id"
            v-model="form.cause"
            placeholder="Слёт, болезнь, бескормица…" />
    </FormField>
    <FormHint>Семья будет помечена как «погибла».</FormHint>
</template>
