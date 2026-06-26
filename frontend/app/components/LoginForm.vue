<script setup lang="ts">
// Вход в существующий аккаунт: login() заменяет локальные данные данными аккаунта (reset + pull).
// Используется и на онбординге, и на странице аккаунта.
const { login } = useAuth();

const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref<string | null>(null);

async function submit(): Promise<void> {
    busy.value = true;
    error.value = null;
    try {
        await login(email.value.trim(), password.value);
        await returnTo("/");
    } catch (e) {
        error.value = e instanceof Error ? e.message : "Ошибка";
        busy.value = false;
    }
}
</script>

<template>
    <form
        class="form"
        @submit.prevent="submit">
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
            label="Пароль"
            required>
            <BaseInput
                :id="id"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required />
        </FormField>
        <p
            v-if="error"
            class="form__error">
            {{ error }}
        </p>
        <BaseButton
            type="submit"
            :loading="busy"
            block>
            Войти
        </BaseButton>
    </form>
</template>

<style scoped lang="scss">
.form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.form__error {
    color: var(--color-danger);
    font-size: var(--text-sm);
}
</style>
