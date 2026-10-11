<script setup lang="ts">
defineProps<{
    email: string;
    offline?: boolean;
}>();

const { busy, unsent, run: logout } = useSafeLogout();
</script>

<template>
    <InfoGrid>
        <InfoRow label="Почта">{{ email }}</InfoRow>
    </InfoGrid>
    <FormHint>Данные привязаны к этому аккаунту и доступны на других устройствах после входа.</FormHint>

    <p
        v-if="unsent"
        class="unsent">
        Не отправлено на сервер: {{ unsent }}. При выходе эти изменения будут потеряны — нажмите «Выйти» ещё раз, чтобы
        подтвердить.
    </p>

    <BaseButton
        variant="secondary"
        :loading="busy"
        :disabled="offline"
        block
        @click="logout">
        {{ unsent ? "Выйти и потерять изменения" : "Выйти" }}
    </BaseButton>
</template>

<style scoped lang="scss">
.unsent {
    color: var(--color-danger);
    font-size: var(--text-sm);
}
</style>
