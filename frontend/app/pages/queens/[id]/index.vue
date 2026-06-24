<script setup lang="ts">
import type { LocalColony, LocalQueen } from "~/shared/db";

const route = useRoute();
const id = route.params.id as string;

const db = useDb();

type PageData = {
    queen: LocalQueen | undefined;
    colony: LocalColony | undefined;
    mother: LocalQueen | undefined;
};

const EMPTY: PageData = { queen: undefined, colony: undefined, mother: undefined };

const { data, loading } = useLiveQuery<PageData>(async () => {
    const queen = await db.queen.get(id);
    if (!queen) return EMPTY;

    const [colony, mother] = await Promise.all([
        queen.colonyId ? db.colony.get(queen.colonyId) : Promise.resolve(undefined),
        queen.motherQueenId ? db.queen.get(queen.motherQueenId) : Promise.resolve(undefined),
    ]);

    return { queen, colony, mother };
}, EMPTY);

useHead(() => ({
    title: data.value.queen ? `Матка ${String(data.value.queen.year ?? "")} — Пасека` : "Матка — Пасека",
}));

const STATUS_LABEL: Record<string, string> = {
    active: "Активна",
    lost: "Пропала",
    died: "Погибла",
    replaced: "Заменена",
    superseded: "Тихая замена",
};

const backTo = computed(() => (data.value.queen?.colonyId ? `/colonies/${data.value.queen.colonyId}` : "/colonies"));

const age = computed(() => {
    const yr = data.value.queen?.year;
    if (!yr) return null;
    const years = new Date().getFullYear() - yr;
    if (years === 0) return "первый год";
    if (years === 1) return "1 год";
    if (years < 5) return `${String(years)} года`;
    return `${String(years)} лет`;
});
</script>

<template>
    <AppPage
        :title="data.queen?.year ? `Матка ${String(data.queen.year)}` : 'Матка'"
        :back-to="backTo"
        variant="stack">
        <template #actions>
            <BaseButton
                variant="ghost"
                size="icon"
                :to="`/queens/${id}/edit`"
                aria-label="Редактировать">
                <Icon
                    name="lucide:pencil"
                    size="20" />
            </BaseButton>
        </template>

        <LoadingSpinner v-if="loading" />

        <template v-else-if="data.queen">
            <section class="section">
                <InfoGrid>
                    <InfoRow label="Статус">{{ STATUS_LABEL[data.queen.status] ?? data.queen.status }}</InfoRow>
                    <InfoRow
                        v-if="data.queen.year"
                        label="Год вывода">
                        {{ data.queen.year }} <span class="value-sub">({{ age }})</span>
                    </InfoRow>
                    <InfoRow
                        v-if="data.queen.breed"
                        label="Порода"
                        >{{ data.queen.breed }}</InfoRow
                    >
                    <InfoRow
                        v-if="data.queen.origin"
                        label="Происхождение"
                        >{{ data.queen.origin }}</InfoRow
                    >
                    <InfoRow
                        v-if="data.queen.introducedAt"
                        label="Подсажена">
                        {{ formatDate(data.queen.introducedAt) }}
                    </InfoRow>
                </InfoGrid>
            </section>

            <section
                v-if="data.colony"
                class="section">
                <h2 class="section__title">Семья</h2>
                <NuxtLink
                    :to="`/colonies/${data.colony.id}`"
                    class="ref-link">
                    <span>{{ data.colony.label }}</span>
                    <Icon
                        name="lucide:chevron-right"
                        size="18"
                        class="ref-link__arrow" />
                </NuxtLink>
            </section>

            <section
                v-if="data.mother"
                class="section">
                <h2 class="section__title">Мать</h2>
                <NuxtLink
                    :to="`/queens/${data.mother.id}`"
                    class="ref-link">
                    <span
                        >{{ data.mother.year ? `Матка ${String(data.mother.year)}` : "Матка"
                        }}{{ data.mother.breed ? ` · ${data.mother.breed}` : "" }}</span
                    >
                    <Icon
                        name="lucide:chevron-right"
                        size="18"
                        class="ref-link__arrow" />
                </NuxtLink>
            </section>
        </template>

        <div
            v-else
            class="not-found">
            <p>Матка не найдена</p>
            <NuxtLink to="/colonies">К семьям</NuxtLink>
        </div>
    </AppPage>
</template>

<style scoped lang="scss">
.section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__title {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-muted);
    }
}

.value-sub {
    font-weight: 400;
    color: var(--color-text-muted);
}

.ref-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    text-decoration: none;
    color: var(--color-text);
    font-size: var(--text-base);
    font-weight: 500;
    min-height: var(--tap-min);
    transition: background-color var(--transition-fast);

    &:active {
        background: var(--color-surface-2);
    }

    &__arrow {
        color: var(--color-text-muted);
        flex-shrink: 0;
    }
}

.not-found {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--color-text-muted);
}
</style>
