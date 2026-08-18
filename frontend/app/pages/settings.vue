<script setup lang="ts">
useHead({ title: "Настройки — Пасека" });

const { me, register, logout } = useAuth();

const { version, builtAt } = useRuntimeConfig().public;
const buildDate = new Date(builtAt).toLocaleString("ru", { dateStyle: "long", timeStyle: "short" });

const loading = ref(true);
const email = ref<string | null>(null);
const offline = ref(false);

const mode = ref<"register" | "login">("register");

// register form
const regEmail = ref("");
const regPassword = ref("");
const regBusy = ref(false);
const regError = ref<string | null>(null);
const regDone = ref(false);

const busyLogout = ref(false);

const pushBusy = ref(false);
const pushError = ref<string | null>(null);
const pushDone = ref(false);

onMounted(async () => {
    const result = await me();
    email.value = result?.email ?? null;
    offline.value = result?.offline ?? false;
    loading.value = false;
});

async function submitRegister(): Promise<void> {
    regBusy.value = true;
    regError.value = null;
    try {
        await register(regEmail.value.trim(), regPassword.value);
        email.value = regEmail.value.trim();
        regDone.value = true;
    } catch (e) {
        regError.value = e instanceof Error ? e.message : "Ошибка";
    } finally {
        regBusy.value = false;
    }
}

async function submitLogout(): Promise<void> {
    busyLogout.value = true;
    await logout();
    await returnTo("/");
}

async function pushData(): Promise<void> {
    pushBusy.value = true;
    pushError.value = null;
    pushDone.value = false;
    try {
        await useSync().pushAll();
        pushDone.value = true;
    } catch (e) {
        pushError.value = e instanceof Error ? e.message : "Ошибка";
    } finally {
        pushBusy.value = false;
    }
}
</script>

<template>
    <AppPage
        title="Настройки"
        variant="stack">
        <section class="section">
            <h2 class="section__title">Аккаунт</h2>

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

                <template v-if="email">
                    <InfoGrid>
                        <InfoRow label="Почта">{{ email }}</InfoRow>
                    </InfoGrid>
                    <p class="hint">Данные привязаны к этому аккаунту и доступны на других устройствах после входа.</p>

                    <p
                        v-if="pushDone"
                        class="success">
                        Данные отправлены на сервер.
                    </p>
                    <p
                        v-if="pushError"
                        class="error">
                        {{ pushError }}
                    </p>

                    <div class="actions">
                        <BaseButton
                            variant="secondary"
                            :loading="pushBusy"
                            :disabled="offline"
                            block
                            @click="pushData">
                            Отправить данные на сервер
                        </BaseButton>
                        <BaseButton
                            variant="secondary"
                            :loading="busyLogout"
                            :disabled="offline"
                            block
                            @click="submitLogout">
                            Выйти
                        </BaseButton>
                    </div>
                </template>

                <p
                    v-else-if="regDone"
                    class="success">
                    Аккаунт сохранён — теперь можно войти с этим логином на другом устройстве.
                </p>

                <template v-else-if="mode === 'register'">
                    <p class="hint">
                        Сейчас данные хранятся только на этом устройстве. Привяжите почту и пароль, чтобы сохранить их
                        на сервере и открыть на другом устройстве.
                    </p>
                    <form
                        class="form"
                        @submit.prevent="submitRegister">
                        <FormField
                            v-slot="{ id }"
                            label="Почта"
                            required>
                            <BaseInput
                                :id="id"
                                v-model="regEmail"
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
                                v-model="regPassword"
                                type="password"
                                autocomplete="new-password"
                                minlength="8"
                                required />
                        </FormField>
                        <p
                            v-if="regError"
                            class="error">
                            {{ regError }}
                        </p>
                        <BaseButton
                            type="submit"
                            :loading="regBusy"
                            block
                            >Сохранить</BaseButton
                        >
                    </form>
                    <button
                        type="button"
                        class="switch"
                        @click="mode = 'login'">
                        Уже есть аккаунт? Войти
                    </button>
                </template>

                <template v-else>
                    <p class="hint">Вход заменит локальные данные данными аккаунта.</p>
                    <LoginForm />
                    <button
                        type="button"
                        class="switch"
                        @click="mode = 'register'">
                        Нет аккаунта? Сохранить текущие данные
                    </button>
                </template>
            </template>
        </section>
        <section class="section">
            <h2 class="section__title">Приложение</h2>
            <InfoGrid>
                <InfoRow label="Тёмная тема">
                    <ThemeToggle />
                </InfoRow>
                <InfoRow label="Версия">v{{ version }}</InfoRow>
                <InfoRow label="Сборка">{{ buildDate }}</InfoRow>
            </InfoGrid>
        </section>
    </AppPage>
</template>

<style scoped lang="scss">
.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__title {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
        padding: 0 var(--space-1);
    }
}

.actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
}

.hint {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}

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

.error {
    color: var(--color-danger);
    font-size: var(--text-sm);
}

.success {
    color: var(--color-success);
    font-size: var(--text-sm);
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
