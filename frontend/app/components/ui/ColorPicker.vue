<script setup lang="ts">
const color = defineModel<string>();

const colorInput = ref<HTMLInputElement | null>(null);
const customColors = ref<string[]>(
    color.value && HIVE_COLORS.findIndex((c) => c.key == color.value) == -1 ? [color.value] : [],
);

function onAddColor() {
    if (colorInput.value) {
        colorInput.value.click();
    }
}

function onCustomColorSelect() {
    const value = colorInput.value?.value;
    if (!value) return;
    customColors.value.push(value);
    color.value = value;
}
</script>
<template>
    <div class="color-picker">
        <button
            type="button"
            class="color-swatch color-swatch--none"
            :class="{ 'color-swatch--active': !color }"
            @click="color = ''" />
        <button
            v-for="c in HIVE_COLORS"
            :key="c.key"
            type="button"
            class="color-swatch"
            :class="{ 'color-swatch--active': color === c.key }"
            :style="{ background: c.hex }"
            @click="color = c.key" />
        <button
            v-for="c in customColors"
            :key="c"
            type="button"
            class="color-swatch"
            :class="{ 'color-swatch--active': color === c }"
            :style="{ background: c }"
            @click="color = c" />
        <button
            class="color-swatch color-swatch--add"
            type="button"
            @click="onAddColor">
            <Icon
                name="lucide:plus"
                size="18" />
            <input
                ref="colorInput"
                type="color"
                @change="onCustomColorSelect" />
        </button>
    </div>
</template>
<style lang="scss" scoped>
.color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.color-swatch {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform var(--transition-fast);

    &--add {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-secondary-container);
        position: relative;

        input[type="color"] {
            visibility: hidden;
            position: absolute;
        }
    }

    &--none {
        background: var(--color-border);
    }

    &--active {
        border-color: var(--color-text);
        transform: scale(1.15);
    }
}
</style>
