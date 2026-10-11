<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

const props = defineProps<{
    hives: LocalHive[];
    colonyByHiveId: Record<string, LocalColony>;
    queenById: Record<string, LocalQueen>;
}>();

function queenOf(colony: LocalColony | undefined): LocalQueen | undefined {
    return colony?.currentQueenId ? props.queenById[colony.currentQueenId] : undefined;
}
</script>

<template>
    <ul class="hive-list">
        <li
            v-for="hive in hives"
            :key="hive.id">
            <HiveCard
                :hive="hive"
                :colony="colonyByHiveId[hive.id]"
                :queen="queenOf(colonyByHiveId[hive.id])" />
        </li>
    </ul>
</template>

<style scoped lang="scss">
.hive-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 0;
    margin: 0;
}
</style>
