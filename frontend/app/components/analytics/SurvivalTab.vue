<script setup lang="ts">
import { buildSurvival, EMPTY_SURVIVAL } from "~/utils/analytics/survival";

const db = useDb();

const { data, loading } = useLiveQuery(async () => {
    const [colonies, deathEvents] = await Promise.all([
        db.colony.toArray(),
        db.event
            .where("type")
            .equals("death")
            .filter((e) => !e.deletedAt)
            .toArray(),
    ]);
    return buildSurvival(colonies, deathEvents);
}, EMPTY_SURVIVAL);
</script>

<template>
    <LoadingSpinner v-if="loading" />
    <template v-else>
        <div class="totals">
            <div class="total-card">
                <span class="total-card__label">Активных</span>
                <span class="total-card__value">{{ data.activeCount }}</span>
            </div>
            <div class="total-card">
                <span class="total-card__label">Погибших</span>
                <span class="total-card__value total-card__value--danger">{{ data.deadCount }}</span>
            </div>
        </div>

        <template v-if="data.years.length > 0">
            <div
                v-for="yr in data.years"
                :key="yr.year"
                class="survival-year">
                <div class="survival-year__header">
                    <span class="survival-year__title">{{ yr.year }}</span>
                    <span
                        class="survival-year__rate"
                        :class="yr.rate >= 80 ? 'survival-year__rate--ok' : 'survival-year__rate--warn'">
                        {{ yr.rate }}% выживаемость
                    </span>
                </div>
                <div class="survival-year__bar">
                    <div
                        class="survival-year__bar-fill"
                        :style="{ width: `${yr.rate}%` }"
                        :class="
                            yr.rate >= 80 ? 'survival-year__bar-fill--ok' : 'survival-year__bar-fill--warn'
                        " />
                </div>
                <section class="event-list">
                    <div
                        v-for="c in yr.colonies"
                        :key="c.label"
                        class="event-row">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ c.label }}</span>
                            <span class="event-row__date">{{ c.diedAt ? formatDayMonth(c.diedAt) : "" }}</span>
                        </div>
                    </div>
                </section>
            </div>
        </template>
        <EmptyState
            v-else
            icon="lucide:heart-pulse"
            text="Нет данных об отходе"
            hint="Погибшие семьи появятся здесь после события «Гибель»" />
    </template>
</template>

<style scoped lang="scss">
.survival-year {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
    }

    &__title {
        font-size: var(--text-base);
        font-weight: 700;
    }

    &__rate {
        font-size: var(--text-sm);
        font-weight: 600;

        &--ok {
            color: var(--color-success);
        }
        &--warn {
            color: var(--color-warning);
        }
    }

    &__bar {
        height: 6px;
        border-radius: var(--radius-full);
        background: color-mix(in srgb, var(--color-border) 60%, transparent);
        overflow: hidden;
    }

    &__bar-fill {
        height: 100%;
        border-radius: var(--radius-full);
        transition: width 0.3s ease;

        &--ok {
            background: var(--color-success);
        }
        &--warn {
            background: var(--color-warning);
        }
    }
}
</style>
