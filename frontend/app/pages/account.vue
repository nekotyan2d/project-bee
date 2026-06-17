<script setup lang="ts">
useHead({ title: "Аккаунт — Пасека" });

const { me, register, login, logout } = useAuth();

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

// login form
const logEmail = ref("");
const logPassword = ref("");
const logBusy = ref(false);
const logError = ref<string | null>(null);

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

async function submitLogin(): Promise<void> {
    logBusy.value = true;
    logError.value = null;
    try {
        await login(logEmail.value.trim(), logPassword.value);
        await navigateTo("/");
    } catch (e) {
        logError.value = e instanceof Error ? e.message : "Ошибка";
        logBusy.value = false;
    }
}

async function submitLogout(): Promise<void> {
    busyLogout.value = true;
    await logout();
    await navigateTo("/");
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
        title="Аккаунт"
        variant="stack">
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
                <section class="section">
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
                </section>
            </template>

            <template v-else-if="regDone">
                <section class="section">
                    <h2 class="section__title">Аккаунт сохранён</h2>
                    <p class="success">Теперь можно войти с этим логином на другом устройстве.</p>
                </section>
            </template>
            <template v-else-if="mode === 'register'">
                <section class="section">
                    <h2 class="section__title">Сохранить аккаунт</h2>
                    <p class="hint">
                        Привяжите почту и пароль к текущим данным, чтобы открыть их на другом устройстве.
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
                </section>
            </template>

            <template v-else>
                <section class="section">
                    <h2 class="section__title">Вход</h2>
                    <p class="hint">Вход заменит локальные данные данными аккаунта.</p>
                    <form
                        class="form"
                        @submit.prevent="submitLogin">
                        <FormField
                            v-slot="{ id }"
                            label="Почта"
                            required>
                            <BaseInput
                                :id="id"
                                v-model="logEmail"
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
                                v-model="logPassword"
                                type="password"
                                autocomplete="current-password"
                                required />
                        </FormField>
                        <p
                            v-if="logError"
                            class="error">
                            {{ logError }}
                        </p>
                        <BaseButton
                            type="submit"
                            :loading="logBusy"
                            block
                            >Войти</BaseButton
                        >
                    </form>
                    <button
                        type="button"
                        class="switch"
                        @click="mode = 'register'">
                        Нет аккаунта? Сохранить текущие данные
                    </button>
                </section>
            </template>
        </template>
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
    }
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
    margin-bottom: var(--space-3);
    background: color-mix(in srgb, var(--color-warning) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-warning) 30%, transparent);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-warning);
}
</style>
