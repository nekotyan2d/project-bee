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

type HiveNode = {
    hive: LocalHive;
    x: number;
    y: number;
    colony: LocalColony | undefined;
    fill: string;
    stroke: string;
    textColor: string;
    textMuted: string;
    statusColor: string | null;
    subtitle: string;
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

    const placed = props.hives.filter((h) => Number.isFinite(h.x) && Number.isFinite(h.y));
    const anchorX = placed.length ? Math.min(...placed.map((h) => h.x as number)) : PAD;
    const anchorY = placed.length ? Math.max(...placed.map((h) => (h.y as number) + CARD_H)) + GAP : PAD;
    let free = 0;

    return props.hives.map((hive) => {
        const colony = props.colonyByHiveId[hive.id];
        let pos: Pos;
        if (Number.isFinite(hive.x) && Number.isFinite(hive.y)) {
            pos = { x: hive.x as number, y: hive.y as number };
        } else {
            pos = {
                x: anchorX + (free % COLS) * GRID_COL_W,
                y: anchorY + Math.floor(free / COLS) * GRID_ROW_H,
            };
            free++;
        }

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

        let statusColor: string | null = null;
        if (colony) {
            const lvl = inspectionStatus(colony.lastInspectedAt).level;
            if (lvl === "warn") statusColor = c.warning;
            else if (lvl === "alert") statusColor = c.danger;
        }

        const subtitle = colony ? (colony.superCount > 0 ? `${String(colony.superCount)} маг.` : "") : "Пусто";

        return { hive, x: pos.x, y: pos.y, colony, fill, stroke, textColor, textMuted, statusColor, subtitle };
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

    if (others.length > 0) {
        const M = GRID_COL_W * 1.5;
        const oMinX = Math.min(...others.map((o) => o.x));
        const oMinY = Math.min(...others.map((o) => o.y));
        const oMaxX = Math.max(...others.map((o) => o.x + CARD_W));
        const oMaxY = Math.max(...others.map((o) => o.y + CARD_H));
        best = {
            x: Math.min(Math.max(best.x, oMinX - M), oMaxX - CARD_W + M),
            y: Math.min(Math.max(best.y, oMinY - M), oMaxY - CARD_H + M),
        };
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
    const posX = Math.round(stageW.value / 2 - (minX + maxX) / 2);
    const posY = Math.round(stageH.value / 2 - (minY + maxY) / 2);
    if (!Number.isFinite(posX) || !Number.isFinite(posY)) return;
    const stage = stageRef.value.getNode();
    stage.position({ x: posX, y: posY });
    stage.batchDraw();
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
                        :config="{
                            text: node.subtitle,
                            width: CARD_W,
                            align: 'center',
                            y: 34,
                            fontSize: 11,
                            fill: node.textMuted,
                        }" />
                    <v-circle
                        v-if="node.statusColor"
                        :config="{
                            x: CARD_W - 11,
                            y: 11,
                            radius: 5,
                            fill: node.statusColor,
                            stroke: '#ffffff',
                            strokeWidth: 1.5,
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
