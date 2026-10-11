<script setup lang="ts">
const open = defineModel<boolean>({ required: true });
</script>

<template>
    <BaseBottomSheet v-model="open">
        <SheetTitle>Добавить</SheetTitle>
        <nav class="create-list">
            <SheetItem
                to="/colonies/new"
                icon="lucide:users"
                label="Новая семья"
                hint="Поселить семью в улей"
                arrow
                @click="open = false" />
            <SheetItem
                to="/hives/new"
                icon="lucide:box"
                label="Пустой улей"
                hint="Без семьи — заселить позже"
                arrow
                @click="open = false" />
        </nav>
    </BaseBottomSheet>
</template>

<style scoped lang="scss">
.create-list {
    display: flex;
    flex-direction: column;
}
</style>
