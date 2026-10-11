<script setup lang="ts">
import type { QueenForm } from "~/utils/entityForms";

defineProps<{ edit?: boolean }>();

const form = defineModel<QueenForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Год вывода">
        <BaseInput
            :id="id"
            v-model="form.year"
            type="number"
            inputmode="numeric"
            :min="MIN_QUEEN_YEAR"
            :max="MAX_QUEEN_YEAR"
            placeholder="2024"
            :autofocus="!edit" />
    </FormField>

    <FormField
        v-slot="{ id }"
        label="Порода">
        <BaseInput
            :id="id"
            v-model="form.breed"
            placeholder="Карника, бакфаст…"
            autocomplete="off" />
    </FormField>

    <FormField
        v-slot="{ id }"
        label="Происхождение">
        <BaseInput
            :id="id"
            v-model="form.origin"
            placeholder="Питомник, отводок…"
            autocomplete="off" />
    </FormField>

    <FormField
        v-slot="{ id }"
        label="Дата подсадки">
        <BaseInput
            :id="id"
            v-model="form.introducedAt"
            type="date" />
    </FormField>

    <FormField
        v-if="edit"
        v-slot="{ id }"
        label="Статус">
        <BaseSelect
            :id="id"
            v-model="form.status">
            <option value="active">Активна</option>
            <option value="lost">Пропала</option>
            <option value="died">Погибла</option>
            <option value="replaced">Заменена</option>
            <option value="superseded">Тихая замена</option>
        </BaseSelect>
    </FormField>
</template>
