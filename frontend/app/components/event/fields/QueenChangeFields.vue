<script setup lang="ts">
import type { EventHints } from "~/composables/useEventHints";
import type { QueenAction } from "~/composables/useEventWriter";

defineProps<{ suggest: EventHints }>();

const action = defineModel<QueenAction>("action", { required: true });
const year = defineModel<string>("year", { required: true });
const breed = defineModel<string>("breed", { required: true });

const needsNewQueen = computed(() => QUEEN_SET_ACTIONS.has(action.value));
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Что произошло">
        <BaseSelect
            :id="id"
            v-model="action">
            <option value="introduced">Подсадил новую матку</option>
            <option value="replaced">Заменил матку</option>
            <option value="superseded">Тихая смена</option>
            <option value="lost">Матка потеряна</option>
            <option value="died">Матка погибла</option>
        </BaseSelect>
    </FormField>
    <template v-if="needsNewQueen">
        <FormField
            v-slot="{ id }"
            label="Год вывода матки">
            <BaseInput
                :id="id"
                v-model="year"
                type="number"
                inputmode="numeric"
                :min="MIN_QUEEN_YEAR"
                :max="MAX_QUEEN_YEAR"
                placeholder="2024" />
        </FormField>
        <FormField
            v-slot="{ id }"
            label="Порода">
            <SuggestInput
                :id="id"
                v-model="breed"
                :options="suggest.hints('breed')"
                placeholder="Карника, бакфаст…"
                autocomplete="off" />
        </FormField>
    </template>
</template>
