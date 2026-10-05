<script setup lang="ts">
export interface SuggestOption {
    value: string;
    hint?: string;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<{ options: SuggestOption[] }>();
const emit = defineEmits<{ commit: [value: string] }>();
const model = defineModel<string | number>({ default: "" });

const open = ref(false);

const visible = computed(() => {
    const q = String(model.value).trim().toLowerCase();
    return props.options.filter((o) => o.value.toLowerCase().includes(q) && o.value.toLowerCase() !== q);
});

function pick(value: string) {
    model.value = value;
    open.value = false;
    emit("commit", value);
}
</script>

<template>
    <div class="suggest">
        <BaseInput
            v-bind="$attrs"
            v-model="model"
            @focus="open = true"
            @blur="open = false"
            @change="emit('commit', String(model))"
            @input="open = true"
            @keydown.esc="open = false" />
        <ul
            v-if="open && visible.length > 0"
            class="suggest__list">
            <li
                v-for="o in visible"
                :key="o.value">
                <button
                    type="button"
                    class="suggest__item"
                    @mousedown.prevent="pick(o.value)">
                    <span>{{ o.value }}</span>
                    <span
                        v-if="o.hint"
                        class="suggest__hint"
                        >{{ o.hint }}</span
                    >
                </button>
            </li>
        </ul>
    </div>
</template>

<style scoped lang="scss">
.suggest {
    position: relative;

    &__list {
        position: absolute;
        z-index: 10;
        top: calc(100% + var(--space-1));
        left: 0;
        right: 0;
        max-height: 14rem;
        overflow-y: auto;
        margin: 0;
        padding: var(--space-1);
        list-style: none;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
    }

    &__item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        padding: var(--space-2) var(--space-3);
        border: 0;
        border-radius: var(--radius-sm);
        background: none;
        color: var(--color-text);
        font: inherit;
        text-align: left;
        min-height: var(--tap-min);
        justify-content: center;
        cursor: pointer;

        &:hover {
            background: var(--color-bg);
        }
    }

    &__hint {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
    }
}
</style>
