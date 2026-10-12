<script setup lang="ts">
defineProps<{ open: boolean }>();
</script>

<template>
    <div
        class="collapse"
        :class="{ 'collapse--open': open }"
        :inert="!open">
        <div class="collapse__inner">
            <slot />
        </div>
    </div>
</template>

<style scoped lang="scss">
.collapse {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--motion-normal);

    &--open {
        grid-template-rows: 1fr;
    }

    &__inner {
        overflow: hidden;
        min-height: 0;
        margin: -4px;
        padding: 4px;
        visibility: hidden;
        transition: visibility 0s var(--motion-normal);
    }

    &--open &__inner {
        visibility: visible;
        transition-delay: 0s;
    }
}
</style>
