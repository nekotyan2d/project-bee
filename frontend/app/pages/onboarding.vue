<script setup lang="ts">
import { uuidv7 } from "uuidv7";

import type { LocalApiary } from "~/shared/db";

definePageMeta({ middleware: [] });
useHead({ title: "Добро пожаловать — Пасека" });

const db = useDb();
const { enqueue } = useSync();

const mode = ref<"create" | "login">("create");

const name = ref("");
const notes = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);

async function submit(): Promise<void> {
    const trimmed = name.value.trim();
    if (!trimmed) return;

    submitting.value = true;
    error.value = null;

    const apiary: LocalApiary = {
        id: uuidv7(),
        name: trimmed,
        notes: notes.value.trim() || undefined,
        updatedAt: new Date(),
    };

    try {
        await db.apiary.add(apiary);
    } catch {
        error.value = "Не удалось сохранить. Попробуйте ещё раз.";
        submitting.value = false;
        return;
    }

    void enqueue("apiary", apiary.id, "upsert");

    await navigateTo("/");
}
</script>

<template>
    <main class="onboarding">
        <div class="onboarding__card">
            <div class="onboarding__icon">
                <Icon
                    name="lucide:hexagon"
                    size="48" />
            </div>
            <h1 class="onboarding__title">Добро пожаловать!</h1>
            <p class="onboarding__hint">
                {{ mode === "create" ? "Дайте название вашей пасеке, чтобы начать." : "Войдите в существующий аккаунт." }}
            </p>

            <template v-if="mode === 'create'">
                <form
                    class="onboarding__form"
                    @submit.prevent="submit">
                    <FormField
                        v-slot="{ id }"
                        label="Название пасеки"
                        required>
                        <BaseInput
                            :id="id"
                            v-model="name"
                            placeholder="Моя пасека"
                            autocomplete="off"
                            autofocus
                            required />
                    </FormField>

                    <FormField
                        v-slot="{ id }"
                        label="Заметки (необязательно)">
                        <BaseTextarea
                            :id="id"
                            v-model="notes"
                            placeholder="Адрес, особенности места…"
                            :rows="3" />
                    </FormField>

                    <p
                        v-if="error"
                        class="onboarding__error">
                        {{ error }}
                    </p>

                    <BaseButton
                        type="submit"
                        :loading="submitting"
                        block>
                        Начать
                    </BaseButton>
                </form>

                <button
                    type="button"
                    class="onboarding__switch"
                    @click="mode = 'login'">
                    Уже есть пасека в аккаунте? Войти
                </button>
            </template>

            <template v-else>
                <div class="onboarding__form">
                    <LoginForm />
                </div>

                <button
                    type="button"
                    class="onboarding__switch"
                    @click="mode = 'create'">
                    Создать новую пасеку
                </button>
            </template>
        </div>
    </main>
</template>

<style scoped lang="scss">
.onboarding {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: var(--space-4);

    &__card {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
    }

    &__icon {
        color: var(--color-primary);
    }

    &__title {
        font-size: var(--text-2xl);
        font-weight: 700;
        text-align: center;
    }

    &__hint {
        color: var(--color-text-muted);
        text-align: center;
    }

    &__form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    &__error {
        color: var(--color-danger);
        font-size: var(--text-sm);
    }

    &__switch {
        background: none;
        border: none;
        padding: var(--space-2);
        color: var(--color-primary);
        font-size: var(--text-sm);
        font-weight: 500;
        cursor: pointer;
        min-height: var(--tap-min);
    }
}
</style>
