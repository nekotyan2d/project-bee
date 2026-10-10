<script setup lang="ts">
import type { EventHints } from "~/composables/useEventHints";
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

defineProps<{ suggest: EventHints }>();
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Тип корма"
        required>
        <BaseSelect
            :id="id"
            v-model="form.feedType"
            required>
            <option value="">Выберите тип</option>
            <option
                v-for="(label, value) in FEED_TYPE_LABEL"
                :key="value"
                :value="value">
                {{ capitalize(label) }}
            </option>
        </BaseSelect>
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Количество (л)">
        <BaseInput
            :id="id"
            v-model="form.amountKg"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.1"
            placeholder="0" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Концентрация">
        <SuggestInput
            :id="id"
            v-model="form.concentration"
            :options="suggest.hints('concentration')"
            placeholder="1:1, 50%…"
            autocomplete="off" />
    </FormField>
</template>
