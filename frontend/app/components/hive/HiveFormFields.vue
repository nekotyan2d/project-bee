<script setup lang="ts">
import type { HiveForm } from "~/utils/entityForms";

defineProps<{ edit?: boolean }>();

const form = defineModel<HiveForm>({ required: true });
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Название"
        required>
        <BaseInput
            :id="id"
            v-model="form.label"
            placeholder="Улей №1"
            autocomplete="off"
            :autofocus="!edit"
            required />
    </FormField>

    <FormField
        v-slot="{ id }"
        label="Тип">
        <BaseSelect
            :id="id"
            v-model="form.type">
            <option value="">Не указан</option>
            <option
                v-for="t in HIVE_TYPES"
                :key="t.value"
                :value="t.value">
                {{ t.label }}
            </option>
        </BaseSelect>
    </FormField>

    <FormField label="Цвет">
        <ColorPicker v-model="form.color" />
    </FormField>

    <FormField
        v-slot="{ id }"
        label="Вместимость (рамок)">
        <BaseInput
            :id="id"
            v-model="form.frameCount"
            type="number"
            inputmode="numeric"
            min="0"
            placeholder="12" />
    </FormField>

    <FormField
        v-if="edit"
        v-slot="{ id }"
        label="Статус">
        <BaseSelect
            :id="id"
            v-model="form.status">
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
        </BaseSelect>
    </FormField>
</template>
