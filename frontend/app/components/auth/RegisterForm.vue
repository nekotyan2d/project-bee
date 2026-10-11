<script setup lang="ts">
const emit = defineEmits<{ registered: [email: string] }>();

const { register } = useAuth();

const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref<string | null>(null);

async function submit(): Promise<void> {
    busy.value = true;
    error.value = null;
    try {
        const address = email.value.trim();
        await register(address, password.value);
        emit("registered", address);
    } catch (e) {
        error.value = e instanceof Error ? e.message : "Ошибка";
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <FormShell
        :error="error"
        :submitting="busy"
        @submit="submit">
        <FormField
            v-slot="{ id }"
            label="Почта"
            required>
            <BaseInput
                :id="id"
                v-model="email"
                type="email"
                autocomplete="email"
                required />
        </FormField>
        <FormField
            v-slot="{ id }"
            label="Пароль (минимум 8 символов)"
            required>
            <BaseInput
                :id="id"
                v-model="password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required />
        </FormField>
    </FormShell>
</template>
