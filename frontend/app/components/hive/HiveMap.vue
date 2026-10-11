<script setup lang="ts">
import type { LocalColony, LocalHive, LocalQueen } from "~/shared/db";
import { CARD_H, CARD_W, centerOffset, placeHives, type Pos, snapAndConstrain } from "~/utils/hiveMapLayout";

const props = defineProps<{
    hives: LocalHive[];
    colonyByHiveId: Record<string, LocalColony>;
    queenById: Record<string, LocalQueen>;
}>();

const { moveHive } = useEntityWriter();
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

    const positions = placeHives(props.hives);

    return props.hives.map((hive, i) => {
        const colony = props.colonyByHiveId[hive.id];
        const pos = positions[i] as Pos;

        let fill = c.border;
        let stroke = c.muted;

        const hex = hiveColorHex(hive.color) || hive.color;
        let textColor = c.text;
        let textMuted = c.muted;
        if (hex) {
            fill = hex;
            stroke = hex;
            const readable = readableTextColors(hex);
            textColor = readable.text;
            textMuted = readable.muted;
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

type KonvaEvt = { target: { x: () => number; y: () => number; position: (p: Pos) => void } };

function onDragMoveHive(node: HiveNode, evt: KonvaEvt): void {
    const raw = { x: evt.target.x(), y: evt.target.y() };
    const others = nodes.value.filter((n) => n.hive.id !== node.hive.id);
    evt.target.position(snapAndConstrain(others, raw));
}

async function onDragEnd(node: HiveNode, evt: KonvaEvt): Promise<void> {
    await moveHive(node.hive.id, Math.round(evt.target.x()), Math.round(evt.target.y()));
}

function onClick(node: HiveNode): void {
    void router.push(node.colony ? `/colonies/${node.colony.id}` : `/hives/${node.hive.id}`);
}

type KonvaStage = { getNode(): { position(p: Pos): void; batchDraw(): void } };
const stageRef = ref<KonvaStage | null>(null);

const centered = ref(false);
watchEffect(() => {
    if (centered.value || nodes.value.length === 0 || !stageRef.value) return;
    const { x: posX, y: posY } = centerOffset(nodes.value, stageW.value, stageH.value);
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
