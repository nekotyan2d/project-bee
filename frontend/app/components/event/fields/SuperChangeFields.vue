<script setup lang="ts">
import type { EventHints } from "~/composables/useEventHints";
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

defineProps<{ suggest: EventHints }>();

const action = defineModel<string>("action", { required: true });
const count = defineModel<string>("count", { required: true });

const ACTION_OPTS = [
    { value: "add", label: "Поставить" },
    { value: "remove", label: "Снять" },
];
</script>

<template>
    <FormField label="Действие">
        <ChoiceChips
            v-model="action"
            :options="ACTION_OPTS" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Количество">
        <BaseInput
            :id="id"
            v-model="count"
            type="number"
            inputmode="numeric"
            min="1"
            placeholder="1" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Причина">
        <SuggestInput
            :id="id"
            v-model="form.reason"
            :options="suggest.hints('reason')"
            placeholder="Взяток начался…"
            autocomplete="off" />
    </FormField>
</template>
