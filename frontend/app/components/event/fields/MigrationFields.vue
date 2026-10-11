<script setup lang="ts">
import type { LocalHive } from "~/shared/db";
import type { EventForm } from "~/utils/eventPayload";

const form = defineModel<EventForm>({ required: true });

defineProps<{ hives: LocalHive[] }>();
</script>

<template>
    <FormField
        v-slot="{ id }"
        label="В какой улей"
        required>
        <BaseSelect
            :id="id"
            v-model="form.toHiveId"
            required>
            <option value="">Выберите улей</option>
            <option
                v-for="h in hives"
                :key="h.id"
                :value="h.id">
                {{ h.label }}
            </option>
        </BaseSelect>
    </FormField>
    <FormHint v-if="hives.length === 0">Нет других ульев на пасеке.</FormHint>
</template>
