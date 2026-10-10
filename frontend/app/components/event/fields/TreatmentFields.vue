<script setup lang="ts">
import type { EventHints } from "~/composables/useEventHints";
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

defineProps<{ suggest: EventHints }>();

const OPTS = { fill: ["dose", "method", "withdrawalDays"], hint: ["dose", "method"] };
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Препарат"
        required>
        <SuggestInput
            :id="id"
            v-model="form.product"
            :options="suggest.hints('product', OPTS)"
            placeholder="Бипин, Апитрит…"
            autocomplete="off"
            required
            @commit="suggest.fillFrom('product', $event, OPTS)" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Дозировка">
        <SuggestInput
            :id="id"
            v-model="form.dose"
            :options="suggest.hints('dose')"
            placeholder="1 мл на улочку"
            autocomplete="off" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Способ">
        <SuggestInput
            :id="id"
            v-model="form.method"
            :options="suggest.hints('method')"
            placeholder="Обработка парами…"
            autocomplete="off" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Срок ожидания (дней)">
        <BaseInput
            :id="id"
            v-model="form.withdrawalDays"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="0" />
    </FormField>
</template>
