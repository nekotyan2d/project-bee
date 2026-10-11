<script setup lang="ts">
useHead({ title: "Настройки — Пасека" });

const { me } = useAuth();

const loading = ref(true);
const email = ref<string | null>(null);
const offline = ref(false);

const mode = ref<"register" | "login">("register");

onMounted(async () => {
    const result = await me();
    email.value = result?.email ?? null;
    offline.value = result?.offline ?? false;
    loading.value = false;
});
</script>

<template>
    <AppPage
        title="Настройки"
        variant="stack">
        <PageSection title="Аккаунт">
            <LoadingSpinner v-if="loading" />
            <template v-else>
                <p
                    v-if="offline"
                    class="offline-banner">
                    <Icon
                        name="lucide:wifi-off"
                        size="14" />
                    Нет соединения — показаны последние известные данные аккаунта
                </p>

                <SignedInAccount
                    v-if="email"
                    :email="email"
                    :offline="offline" />

                <template v-else-if="mode === 'register'">
                    <FormHint>
                        Сейчас данные хранятся только на этом устройстве. Привяжите почту и пароль, чтобы сохранить их
                        на сервере и открыть на другом устройстве.
                    </FormHint>
                    <RegisterForm @registered="email = $event" />
                    <button
                        type="button"
                        class="switch"
                        @click="mode = 'login'">
                        Уже есть аккаунт? Войти
                    </button>
                </template>

                <template v-else>
                    <FormHint>Вход заменит локальные данные данными аккаунта.</FormHint>
                    <LoginForm />
                    <button
                        type="button"
                        class="switch"
                        @click="mode = 'register'">
                        Нет аккаунта? Сохранить текущие данные
                    </button>
                </template>
            </template>
        </PageSection>

        <PageSection title="Приложение">
            <AppInfo />
        </PageSection>
    </AppPage>
</template>

<style scoped lang="scss">
.switch {
    align-self: center;
    background: none;
    border: none;
    padding: var(--space-2);
    color: var(--color-primary);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    min-height: var(--tap-min);
}

.offline-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-warning);
}
</style>
