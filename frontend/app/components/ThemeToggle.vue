<script setup lang="ts">
const colorMode = useColorMode();

function toggle(): void {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
    <BaseButton variant="ghost" size="icon" :aria-label="`Тема: ${colorMode.value}`" @click="toggle">
        <ClientOnly>
            <Icon :name="colorMode.value === 'dark' ? 'lucide:moon' : 'lucide:sun'" size="20" />
            <template #fallback>
                <Icon name="lucide:sun-moon" size="20" />
            </template>
        </ClientOnly>
    </BaseButton>
</template>
