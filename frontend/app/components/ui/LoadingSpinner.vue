<script setup lang="ts">
// Индикатор загрузки в духе M3: скруглённая сота вращается и перетекает в цветок и обратно.
// Появляется с задержкой, чтобы не мигать на быстрых локальных запросах; `immediate` — без задержки (сеть).
withDefaults(
    defineProps<{
        size?: number;
        immediate?: boolean;
    }>(),
    { size: 48, immediate: false },
);
</script>

<template>
    <div
        class="loader"
        :class="{ 'loader--immediate': immediate }"
        role="status"
        aria-label="Загрузка"
        :style="{ width: `${size}px`, height: `${size}px` }" />
</template>

<style scoped lang="scss">
@use "sass:math";

// Контур из 60 точек: r(θ) = 50% · (1 − depth · (1 − cos 6(θ − phase)) / 2).
// Сота: depth 0.134 (угол 50%, середина стороны ≈ 43%, как у правильного шестиугольника), углы вверху и внизу.
// Цветок: depth 0.3, лепестки сдвинуты на 30° — они приходятся на место сторон соты.
// Число точек у обеих форм одинаковое, поэтому clip-path интерполируется плавно.
@function blob($depth, $phase: 0, $points: 60) {
    $list: ();

    @for $i from 0 to $points {
        $a: math.div(2 * math.$pi * $i, $points);
        $r: 50% * (1 - $depth * math.div(1 - math.cos(6 * ($a - $phase)), 2));
        $x: 50% + $r * math.sin($a);
        $y: 50% - $r * math.cos($a);
        $list: append($list, $x $y, comma);
    }

    @return polygon($list...);
}

$hexagon: blob(0.134);
$flower: blob(0.3, math.div(math.$pi, 6));

.loader {
    margin: var(--space-8) auto;
    background: var(--color-primary);
    clip-path: $hexagon;
    opacity: 0;
    animation:
        loader-in var(--motion-normal) 150ms forwards,
        loader-morph 1.4s ease-in-out infinite,
        loader-spin 2.4s linear infinite;

    &--immediate {
        animation-delay: 0s, 0s, 0s;
    }
}

@keyframes loader-in {
    to {
        opacity: 1;
    }
}

@keyframes loader-morph {
    0%,
    100% {
        clip-path: $hexagon;
    }

    50% {
        clip-path: $flower;
    }
}

@keyframes loader-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
