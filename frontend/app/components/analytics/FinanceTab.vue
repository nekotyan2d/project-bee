<script setup lang="ts">
import type { FinanceSeason } from "~/utils/finance";

const db = useDb();

const { data: seasons, loading } = useLiveQuery<FinanceSeason[]>(
    async () =>
        summarizeFinance(
            await db.event
                .where("type")
                .equals("finance")
                .filter((e) => !e.deletedAt)
                .toArray(),
        ),
    [],
);

const selectedYear = ref<number | null>(null);

const season = computed<FinanceSeason | null>(() => {
    const first = seasons.value[0];
    if (!first) return null;
    return seasons.value.find((s) => s.year === selectedYear.value) ?? first;
});
</script>

<template>
    <div class="section-header">
        <BaseButton
            variant="ghost"
            size="sm"
            to="/events/new?type=finance">
            <Icon
                name="lucide:plus"
                size="16" />
            Добавить операцию
        </BaseButton>
    </div>

    <LoadingSpinner v-if="loading" />
    <template v-else-if="season">
        <div
            v-if="seasons.length > 1"
            class="season-tabs">
            <button
                v-for="s in seasons"
                :key="s.year"
                type="button"
                class="season-tab"
                :class="{ 'season-tab--active': s.year === season.year }"
                @click="selectedYear = s.year">
                {{ s.year }}
            </button>
        </div>

        <div class="totals">
            <div class="total-card">
                <span class="total-card__label">
                    <Icon
                        class="total-card__icon total-card__icon--ok"
                        name="lucide:trending-up"
                        size="14" />
                    Доход
                </span>
                <span class="total-card__value total-card__value--ok">
                    {{ formatMoney(season.income) }}
                </span>
            </div>
            <div class="total-card">
                <span class="total-card__label">
                    <Icon
                        class="total-card__icon total-card__icon--danger"
                        name="lucide:trending-down"
                        size="14" />
                    Расход
                </span>
                <span class="total-card__value total-card__value--danger">
                    {{ formatMoney(season.expense) }}
                </span>
            </div>
            <div class="total-card">
                <span class="total-card__label">
                    <Icon
                        class="total-card__icon"
                        name="lucide:equal"
                        size="14" />
                    Итого
                </span>
                <span
                    class="total-card__value"
                    :class="{
                        'total-card__value--danger': season.income < season.expense,
                    }">
                    {{ formatMoney(season.income - season.expense) }}
                </span>
            </div>
        </div>

        <section class="event-list">
            <div
                v-for="c in season.byCategory"
                :key="`${c.income ? 'i' : 'e'}:${c.category}`"
                class="event-row">
                <div class="event-row__main">
                    <span class="event-row__colony">
                        <Icon
                            class="finance-arrow"
                            :class="c.income ? 'finance-arrow--in' : 'finance-arrow--out'"
                            :name="c.income ? 'lucide:trending-up' : 'lucide:trending-down'"
                            size="14" />
                        {{ FINANCE_CATEGORY_LABEL[c.category] ?? c.category }}
                    </span>
                    <span class="event-row__value">{{ formatMoney(c.sum) }}</span>
                </div>
            </div>
        </section>

        <div
            v-for="month in season.months"
            :key="month.key"
            class="finance-month">
            <h3 class="finance-month__title">{{ month.label }}</h3>
            <section class="event-list">
                <NuxtLink
                    v-for="row in month.rows"
                    :key="row.event.id"
                    class="event-row"
                    :to="`/events/${row.event.id}`">
                    <div class="event-row__main">
                        <span class="event-row__colony">
                            {{ row.item || FINANCE_CATEGORY_LABEL[row.category] || row.category }}
                        </span>
                        <span
                            class="event-row__value"
                            :class="{ 'total-card__value--danger': !row.income }">
                            {{ row.income ? "+" : "−" }}{{ formatMoney(row.amount) }}
                        </span>
                    </div>
                    <div class="event-row__meta">
                        <span>{{
                            row.counterparty || (row.income ? "покупатель не указан" : "продавец не указан")
                        }}</span>
                        <span>{{ formatDayMonth(row.event.occurredAt) }}</span>
                    </div>
                </NuxtLink>
            </section>
        </div>
    </template>
    <EmptyState
        v-else
        icon="lucide:wallet"
        text="Нет финансовых операций"
        hint="Записывайте покупки и продажи — здесь появится приход, расход и сальдо" />
</template>

<style scoped lang="scss">
.finance-month {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    &__title {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--color-text-muted);
        padding-left: var(--space-1);
    }
}

.finance-arrow {
    vertical-align: -2px;

    &--in {
        color: var(--color-success);
    }
    &--out {
        color: var(--color-danger);
    }
}
</style>
