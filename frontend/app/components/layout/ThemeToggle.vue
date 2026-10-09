<script setup lang="ts">
const colorMode = useColorMode();

function toggle(): void {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
    <ClientOnly>
        <label class="switch">
            <input
                type="checkbox"
                :checked="colorMode.value === 'dark'"
                :aria-label="`Тема: ${colorMode.value}`"
                @change="toggle" />
            <span
                class="switch__track"
                aria-hidden="true" />
        </label>
        <template #fallback>
            <span
                class="switch"
                aria-hidden="true">
                <span class="switch__track" />
            </span>
        </template>
    </ClientOnly>
</template>

<style scoped lang="scss">
.switch {
    position: relative;
    display: inline-flex;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;

    input {
        position: absolute;
        inset: 0;
        margin: 0;
        cursor: pointer;
        opacity: 0;

        &:checked + .switch__track {
            background: var(--color-primary-container);

            &::before {
                transform: translateX(20px);
            }
        }

        &:focus-visible + .switch__track {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
        }
    }

    &__track {
        position: absolute;
        inset: 0;
        border-radius: var(--radius-full);
        background: var(--color-surface-3);
        transition: background-color var(--transition-fast);

        &::before {
            content: "";
            position: absolute;
            top: 4px;
            left: 4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--color-bg);
            box-shadow: var(--shadow-sm);
            transition: transform var(--transition-fast);
        }
    }
}
</style>
