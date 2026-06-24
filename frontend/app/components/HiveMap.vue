<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";

const props = defineProps<{
    hives: LocalHive[];
    colonyByHiveId: Record<string, LocalColony>;
    queenById: Record<string, LocalQueen>;
}>();

const db = useDb();
const { enqueue } = useSync();
const router = useRouter();
const colorMode = useColorMode();

function cssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const colors = computed(() => {
    void colorMode.value;
    return {
        text: cssVar("--color-text"),
        muted: cssVar("--color-text-muted"),
        success: cssVar("--color-success"),
        warning: cssVar("--color-warning"),
        danger: cssVar("--color-danger"),
        border: cssVar("--color-border"),
    };
});

const CARD_W = 90;
const CARD_H = 72;
const GRID_COL_W = 110;
const GRID_ROW_H = 90;
const COLS = 4;
const PAD = 16;

function defaultPos(index: number): { x: number; y: number } {
    return {
        x: PAD + (index % COLS) * GRID_COL_W,
        y: PAD + Math.floor(index / COLS) * GRID_ROW_H,
    };
}

type HiveNode = {
    hive: LocalHive;
    x: number;
    y: number;
    colony: LocalColony | undefined;
    fill: string;
    stroke: string;
    textColor: string;
    textMuted: string;
};

const container = ref<HTMLDivElement | null>(null);
const stageW = ref(320);
const stageH = ref(300);

const resizeObserver =
    typeof ResizeObserver !== "undefined"
        ? new ResizeObserver((entries) => {
              const rect = entries[0]?.contentRect;
              if (rect) {
                  stageW.value = rect.width;
                  stageH.value = rect.height;
              }
          })
        : null;

onMounted(() => {
    if (container.value) {
        stageW.value = container.value.clientWidth || 320;
        stageH.value = container.value.clientHeight || 400;
        resizeObserver?.observe(container.value);
    }
});
onUnmounted(() => resizeObserver?.disconnect());

const nodes = computed<HiveNode[]>(() => {
    const c = colors.value;
    return props.hives.map((hive, i) => {
        const colony = props.colonyByHiveId[hive.id];
        const pos = hive.x != null && hive.y != null ? { x: hive.x, y: hive.y } : defaultPos(i);

        let fill = c.border;
        let stroke = c.muted;

        const hex = hiveColorHex(hive.color);
        let textColor = c.text;
        let textMuted = c.muted;
        if (hex) {
            fill = hex;
            stroke = hex;
            textColor = "#ffffff";
            textMuted = "rgba(255,255,255,0.75)";
        }

        return { hive, x: pos.x, y: pos.y, colony, fill, stroke, textColor, textMuted };
    });
});

const GAP = 12;
const SNAP_RANGE = 40;

type Pos = { x: number; y: number };

function overlaps(ax: number, ay: number, bx: number, by: number): boolean {
    return ax < bx + CARD_W + GAP && ax + CARD_W + GAP > bx && ay < by + CARD_H + GAP && ay + CARD_H + GAP > by;
}

function snapAndConstrain(draggingId: string, raw: Pos): Pos {
    const others = nodes.value.filter((n) => n.hive.id !== draggingId);

    let best = { ...raw };
    let bestDist = SNAP_RANGE;

    for (const o of others) {
        const candidates: Pos[] = [
            { x: o.x + CARD_W + GAP, y: o.y },
            { x: o.x - CARD_W - GAP, y: o.y },
            { x: o.x, y: o.y + CARD_H + GAP },
            { x: o.x, y: o.y - CARD_H - GAP },
            { x: o.x + CARD_W + GAP, y: o.y + CARD_H + GAP },
            { x: o.x - CARD_W - GAP, y: o.y - CARD_H - GAP },
            { x: o.x + CARD_W + GAP, y: o.y - CARD_H - GAP },
            { x: o.x - CARD_W - GAP, y: o.y + CARD_H + GAP },
        ];
        for (const c of candidates) {
            const d = Math.hypot(c.x - raw.x, c.y - raw.y);
            if (d < bestDist) {
                bestDist = d;
                best = c;
            }
        }
    }

    for (const o of others) {
        if (!overlaps(best.x, best.y, o.x, o.y)) continue;
        const dx = best.x + CARD_W / 2 - (o.x + CARD_W / 2);
        const dy = best.y + CARD_H / 2 - (o.y + CARD_H / 2);
        if (Math.abs(dx) >= Math.abs(dy)) {
            best = { ...best, x: dx >= 0 ? o.x + CARD_W + GAP : o.x - CARD_W - GAP };
        } else {
            best = { ...best, y: dy >= 0 ? o.y + CARD_H + GAP : o.y - CARD_H - GAP };
        }
    }

    return best;
}

type KonvaEvt = { target: { x: () => number; y: () => number; position: (p: Pos) => void } };

function onDragMoveHive(node: HiveNode, evt: KonvaEvt): void {
    const raw = { x: evt.target.x(), y: evt.target.y() };
    const adjusted = snapAndConstrain(node.hive.id, raw);
    evt.target.position(adjusted);
}

async function onDragEnd(node: HiveNode, evt: KonvaEvt): Promise<void> {
    const x = Math.round(evt.target.x());
    const y = Math.round(evt.target.y());
    await db.hive.update(node.hive.id, { x, y, updatedAt: new Date() });
    void enqueue("hive", node.hive.id, "upsert");
}

function onClick(node: HiveNode): void {
    void router.push(node.colony ? `/colonies/${node.colony.id}` : `/hives/${node.hive.id}`);
}

type KonvaStage = { getNode(): { position(p: Pos): void; batchDraw(): void } };
const stageRef = ref<KonvaStage | null>(null);

const centered = ref(false);
watchEffect(() => {
    if (centered.value || nodes.value.length === 0 || !stageRef.value) return;
    const ns = nodes.value;
    const minX = Math.min(...ns.map((n) => n.x));
    const minY = Math.min(...ns.map((n) => n.y));
    const maxX = Math.max(...ns.map((n) => n.x + CARD_W));
    const maxY = Math.max(...ns.map((n) => n.y + CARD_H));
    stageRef.value.getNode().position({
        x: Math.round(stageW.value / 2 - (minX + maxX) / 2),
        y: Math.round(stageH.value / 2 - (minY + maxY) / 2),
    });
    stageRef.value.getNode().batchDraw();
    centered.value = true;
});

const stageConfig = computed(() => ({ width: stageW.value, height: stageH.value, draggable: true }));
</script>

<template>
    <div
        ref="container"
        class="hive-map">
        <v-stage
            ref="stageRef"
            :config="stageConfig">
            <v-layer>
                <v-group
                    v-for="node in nodes"
                    :key="node.hive.id"
                    :config="{ x: node.x, y: node.y, draggable: true }"
                    @dragmove="onDragMoveHive(node, $event)"
                    @dragend="onDragEnd(node, $event)"
                    @click="onClick(node)"
                    @tap="onClick(node)">
                    <v-rect
                        :config="{
                            width: CARD_W,
                            height: CARD_H,
                            fill: node.fill,
                            stroke: node.stroke,
                            strokeWidth: 1.5,
                            cornerRadius: 10,
                        }" />
                    <v-text
                        :config="{
                            text: node.hive.label,
                            width: CARD_W,
                            align: 'center',
                            y: 14,
                            fontSize: 13,
                            fontStyle: 'bold',
                            fill: node.textColor,
                        }" />
                    <v-text
                        v-if="node.colony"
                        :config="{
                            text: node.colony.superCount > 0 ? `${node.colony.superCount} маг.` : 'Занят',
                            width: CARD_W,
                            align: 'center',
                            y: 34,
                            fontSize: 11,
                            fill: node.textMuted,
                        }" />
                    <v-text
                        v-else
                        :config="{
                            text: 'Пусто',
                            width: CARD_W,
                            align: 'center',
                            y: 34,
                            fontSize: 11,
                            fill: node.textMuted,
                        }" />
                </v-group>
            </v-layer>
        </v-stage>
    </div>
</template>

<style scoped lang="scss">
.hive-map {
    position: fixed;
    left: 0;
    right: 0;
    top: calc(var(--safe-top) + 69px);
    bottom: calc(var(--bottombar-height) + var(--safe-bottom));
    z-index: 1;
    overflow: hidden;
    touch-action: none;
}
</style>
