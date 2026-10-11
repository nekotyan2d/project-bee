<script setup lang="ts">
useHead({ title: "Настройки — Пасека" });

const { me, register, logout } = useAuth();

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
const unsent = ref(0);

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

    if (!unsent.value && (await useDb().outbox.count()) > 0) {
        await useSync().flush();
        unsent.value = await useDb().outbox.count();
        if (unsent.value > 0) {
            busyLogout.value = false;
            return;
        }
    }

    await logout();
    await returnTo("/");
}
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

                <template v-if="email">
                    <InfoGrid>
                        <InfoRow label="Почта">{{ email }}</InfoRow>
                    </InfoGrid>
                    <p class="hint">Данные привязаны к этому аккаунту и доступны на других устройствах после входа.</p>

                    <p
                        v-if="unsent"
                        class="error">
                        Не отправлено на сервер: {{ unsent }}. При выходе эти изменения будут потеряны — нажмите «Выйти»
                        ещё раз, чтобы подтвердить.
                    </p>

                    <div class="actions">
                        <BaseButton
                            variant="secondary"
                            :loading="busyLogout"
                            :disabled="offline"
                            block
                            @click="submitLogout">
                            {{ unsent ? "Выйти и потерять изменения" : "Выйти" }}
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
        </PageSection>

        <PageSection title="Приложение">
            <AppInfo />
        </PageSection>
    </AppPage>
</template>

<style scoped lang="scss">
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
