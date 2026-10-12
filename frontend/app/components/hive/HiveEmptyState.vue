<script setup lang="ts">
import type { LocalColony } from "~/shared/db";

defineProps<{
    hiveId: string;
    unassigned: LocalColony[];
}>();

const emit = defineEmits<{ assign: [colony: LocalColony] }>();

const showPicker = ref(false);

function assign(colony: LocalColony): void {
    showPicker.value = false;
    emit("assign", colony);
}
</script>

<template>
    <p class="empty-note">Улей пустой</p>

    <div>
        <div class="actions">
            <NuxtLink
                :to="`/colonies/new?hiveId=${hiveId}`"
                class="action-btn">
                <Icon
                    name="lucide:plus"
                    size="18" />
                Новая семья
            </NuxtLink>
            <BaseButton
                v-if="unassigned.length > 0"
                variant="secondary"
                @click="showPicker = !showPicker">
                <Icon
                    name="lucide:link"
                    size="20" />
                Привязать семью
            </BaseButton>
        </div>

        <Collapse :open="showPicker">
            <ul class="picker">
                <li
                    v-for="colony in unassigned"
                    :key="colony.id">
                    <button
                        class="picker__item"
                        type="button"
                        @click="assign(colony)">
                        <span class="picker__label">{{ colony.label }}</span>
                        <Icon
                            name="lucide:chevron-right"
                            size="16"
                            class="picker__arrow" />
                    </button>
                </li>
            </ul>
        </Collapse>
    </div>
</template>

<style scoped lang="scss">
.empty-note {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
}

.actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
}

.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: 600;
    text-decoration: none;
    background: var(--color-primary-container);
    color: var(--color-on-primary-container);
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-primary-hover);
    }
}

.picker {
    list-style: none;
    padding: 0;
    margin: 0;
    margin-top: var(--space-3);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    overflow: hidden;

    &__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: var(--space-3) var(--space-4);
        background: none;
        border: none;
        font-size: var(--text-base);
        color: var(--color-text);
        cursor: pointer;
        min-height: var(--list-item-height);
        transition: background-color var(--transition-fast);

        &:hover {
            background: color-mix(in srgb, var(--color-text) 8%, transparent);
        }

        &:active {
            background: color-mix(in srgb, var(--color-text) 12%, transparent);
        }
    }

    &__label {
        font-weight: 500;
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }
}
</style>
