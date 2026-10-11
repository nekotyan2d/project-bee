<script setup lang="ts">
const { version, builtAt } = useRuntimeConfig().public;
const buildDate = new Date(builtAt).toLocaleString("ru", { dateStyle: "long", timeStyle: "short" });
</script>

<template>
    <InfoGrid>
        <InfoRow label="Тёмная тема">
            <ThemeToggle />
        </InfoRow>
        <InfoRow label="Версия">v{{ version }}</InfoRow>
        <InfoRow label="Сборка">{{ buildDate }}</InfoRow>
    </InfoGrid>
</template>
