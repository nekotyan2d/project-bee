<script setup lang="ts">
const { login } = useAuth();
const { getToken } = useAuthToken();
const db = useDb();

const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref<string | null>(null);
const confirmed = ref(false);

const needsConfirm = ref(false);
onMounted(async () => {
    if (getToken()) return;
    const counts = await Promise.all([
        db.apiary.count(),
        db.hive.count(),
        db.colony.count(),
        db.queen.count(),
        db.event.count(),
    ]);
    needsConfirm.value = counts.some((c) => c > 0);
});

async function submit(): Promise<void> {
    if (needsConfirm.value && !confirmed.value) {
        confirmed.value = true;
        return;
    }
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
    <FormShell
        :error="error"
        :submitting="busy"
        :submit-label="needsConfirm && confirmed ? 'Всё равно войти' : 'Войти'"
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
            v-if="needsConfirm && confirmed"
            class="warning">
            На этом устройстве есть несохранённые данные — вход заменит их данными аккаунта. Они будут потеряны.
        </p>
    </FormShell>
</template>

<style scoped lang="scss">
.warning {
    color: var(--color-warning);
    font-size: var(--text-sm);
}
</style>
