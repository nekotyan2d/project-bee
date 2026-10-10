<script setup lang="ts">
import type { EventHints } from "~/composables/useEventHints";
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

defineProps<{ suggest: EventHints }>();

const DIRECTION_OPTS = [
    { value: "expense", label: "Покупка" },
    { value: "income", label: "Продажа" },
];

const categories = computed(() =>
    form.value.direction === "income" ? FINANCE_INCOME_CATEGORIES : FINANCE_EXPENSE_CATEGORIES,
);
watch(categories, (list) => {
    if (!list.includes(String(form.value.category))) form.value.category = list[0] ?? "other";
});

const SAME_DIRECTION = { where: (p: Record<string, unknown>) => p.direction === form.value.direction };
const ITEM_OPTS = { fill: ["counterparty"], hint: ["counterparty"], ...SAME_DIRECTION };
</script>

<template>
    <FormField label="Операция">
        <ChoiceChips
            v-model="form.direction"
            :options="DIRECTION_OPTS" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Сумма"
        required>
        <BaseInput
            :id="id"
            v-model="form.amount"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
            required />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Категория">
        <BaseSelect
            :id="id"
            v-model="form.category">
            <option
                v-for="c in categories"
                :key="c"
                :value="c">
                {{ FINANCE_CATEGORY_LABEL[c] }}
            </option>
        </BaseSelect>
    </FormField>
    <FormField
        v-slot="{ id }"
        :label="form.direction === 'income' ? 'Что продано' : 'Что куплено'">
        <SuggestInput
            :id="id"
            v-model="form.item"
            :options="suggest.hints('item', ITEM_OPTS)"
            placeholder="Мёд, 50 кг"
            autocomplete="off"
            @commit="suggest.fillFrom('item', $event, ITEM_OPTS)" />
    </FormField>
    <FormField
        v-slot="{ id }"
        :label="form.direction === 'income' ? 'Покупатель' : 'Продавец'">
        <SuggestInput
            :id="id"
            v-model="form.counterparty"
            :options="suggest.hints('counterparty', SAME_DIRECTION)"
            placeholder="Имя или магазин"
            autocomplete="off" />
    </FormField>
    <FormField
        v-slot="{ id }"
        label="Заметки">
        <BaseTextarea
            :id="id"
            v-model="form.notes"
            placeholder="Условия, доставка…" />
    </FormField>
</template>
