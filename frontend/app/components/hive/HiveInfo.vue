<script setup lang="ts">
import type { LocalHive } from "~/shared/db";

defineProps<{ hive: LocalHive }>();

const STATUS_LABEL: Record<string, string> = {
    active: "Активен",
    inactive: "Неактивен",
};
</script>

<template>
    <InfoGrid>
        <InfoRow label="Статус">{{ STATUS_LABEL[hive.status] ?? hive.status }}</InfoRow>
        <InfoRow
            v-if="hive.type"
            label="Тип">
            {{ HIVE_TYPE_LABEL[hive.type] ?? hive.type }}
        </InfoRow>
        <InfoRow
            v-if="hive.frameCount"
            label="Вместимость">
            {{ hive.frameCount }} рамок
        </InfoRow>
        <InfoRow
            v-if="hive.color"
            label="Цвет">
            <span
                class="color-dot"
                :style="{ background: hiveColorHex(hive.color) || hive.color }" />
        </InfoRow>
    </InfoGrid>
</template>

<style scoped lang="scss">
.color-dot {
    display: inline-block;
    width: 18px;
    height: 18px;
    border-radius: var(--radius-full);
    vertical-align: middle;
}
</style>
