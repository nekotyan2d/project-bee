<script setup lang="ts">
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

watch(
    () => form.value.product,
    (product) => {
        if (product !== "honey") form.value.framesCount = "";
    },
);
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="Продукт">
        <BaseSelect
            :id="id"
            v-model="form.product">
            <option
                v-for="(label, value) in HARVEST_PRODUCT_LABEL"
                :key="value"
                :value="value">
                {{ capitalize(label) }}
            </option>
        </BaseSelect>
    </FormField>
    <div :class="form.product === 'honey' ? 'grid-2' : undefined">
        <FormField
            v-slot="{ id }"
            :label="`Количество (${harvestUnit(form.product)})`">
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
            v-if="form.product === 'honey'"
            v-slot="{ id }"
            label="Рамок (шт.)">
            <BaseInput
                :id="id"
                v-model="form.framesCount"
                type="number"
                inputmode="decimal"
                min="0"
                step="0.5"
                placeholder="0" />
        </FormField>
    </div>
</template>

<style scoped lang="scss">
.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
}
</style>
