<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

const QUEEN_SEEN_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "true", label: "Видна" },
    { value: "false", label: "Не видна" },
];
const STORES_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "low", label: "Мало" },
    { value: "medium", label: "Достаточно" },
    { value: "high", label: "Много" },
];
const TEMPERAMENT_OPTS = [
    { value: "", label: "Не отмечено" },
    { value: "calm", label: "Спокойный" },
    { value: "nervous", label: "Нервный" },
    { value: "aggressive", label: "Агрессивный" },
];
</script>

<template>
    <div class="grid-2">
        <FormField
            v-slot="{ id }"
            label="Рамок в гнезде">
            <BaseInput
                :id="id"
                v-model="form.framesTotal"
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="0" />
        </FormField>
        <FormField
            v-slot="{ id }"
            label="Рамок расплода">
            <BaseInput
                :id="id"
                v-model="form.framesBrood"
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="0" />
        </FormField>
        <FormField
            v-slot="{ id }"
            label="Рамок корма">
            <BaseInput
                :id="id"
                v-model="form.framesStores"
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="0" />
        </FormField>
        <FormField
            v-slot="{ id }"
            label="Маточники">
            <BaseInput
                :id="id"
                v-model="form.queenCells"
                type="number"
                inputmode="numeric"
                min="0"
                placeholder="0" />
        </FormField>
    </div>
    <FormField label="Матка">
        <ChoiceChips
            v-model="form.queenSeen"
            :options="QUEEN_SEEN_OPTS" />
    </FormField>
    <FormField label="Запасы">
        <ChoiceChips
            v-model="form.storesLevel"
            :options="STORES_OPTS" />
    </FormField>
    <FormField label="Нрав">
        <ChoiceChips
            v-model="form.temperament"
            :options="TEMPERAMENT_OPTS" />
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
