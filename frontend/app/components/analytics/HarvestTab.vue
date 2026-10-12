<script setup lang="ts">
import { buildHarvestSeasons, type SeasonData } from "~/utils/analytics/harvest";
import { loadEventsWithColonies } from "~/utils/analytics/loadEvents";

const productLabel = (p: string): string => capitalize(HARVEST_PRODUCT_LABEL[p] ?? p);

const { data: seasons, loading } = useLiveQuery<SeasonData[]>(async () => {
    const { events, colonies } = await loadEventsWithColonies("harvest");
    return buildHarvestSeasons(events, colonies);
}, []);

const selectedYear = ref<number | null>(null);

const currentSeason = computed<SeasonData | null>(() => {
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
            to="/events/new?type=harvest">
            <Icon
                name="lucide:plus"
                size="16" />
            Записать общий сбор
        </BaseButton>
    </div>
    <LoadingSpinner v-if="loading" />
    <template v-else-if="seasons.length > 0">
        <div
            v-if="seasons.length > 1"
            class="season-tabs">
            <button
                v-for="s in seasons"
                :key="s.year"
                type="button"
                class="season-tab"
                :class="{ 'season-tab--active': s.year === currentSeason?.year }"
                @click="selectedYear = s.year">
                {{ s.year }}
            </button>
        </div>

        <Transition
            name="swap"
            mode="out-in">
            <div
                v-if="currentSeason"
                :key="currentSeason.year"
                class="tab-body">
                <div class="totals">
                    <div
                        v-for="(kg, product) in currentSeason.totalByProduct"
                        :key="product"
                        class="total-card">
                        <span class="total-card__label">{{ productLabel(product) }}</span>
                        <span class="total-card__value">{{ formatAmount(kg, harvestUnit(product)) }}</span>
                    </div>
                    <div
                        v-for="(frames, product) in currentSeason.framesByProduct"
                        :key="`frames-${product}`"
                        class="total-card">
                        <span class="total-card__label">{{ productLabel(product) }}, рамок</span>
                        <span class="total-card__value">{{ frames }}</span>
                    </div>
                </div>

                <section class="event-list">
                    <NuxtLink
                        v-for="row in currentSeason.rows"
                        :key="row.event.id"
                        class="event-row"
                        :to="`/events/${row.event.id}`">
                        <div class="event-row__main">
                            <span class="event-row__colony">{{ row.colony?.label ?? "Вся пасека" }}</span>
                            <span class="event-row__value">
                                {{
                                    [
                                        row.amountKg !== null ? formatAmount(row.amountKg, harvestUnit(row.product)) : null,
                                        row.framesCount !== null ? `${row.framesCount} рам.` : null,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")
                                }}
                            </span>
                        </div>
                        <div class="event-row__meta">
                            <span>{{ productLabel(row.product) }}</span>
                            <span>{{ formatDayMonth(row.event.occurredAt) }}</span>
                        </div>
                    </NuxtLink>
                </section>
            </div>
        </Transition>
    </template>
    <EmptyState
        v-else
        icon="lucide:flask-conical"
        text="Нет откачек"
        hint="Рамки — на странице семьи, итоговый вес партии — кнопкой выше" />
</template>
