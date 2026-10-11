import type { SuggestOption } from "~/components/ui/SuggestInput.vue";
import type { EventForm } from "~/utils/eventPayload";
import { type HistoryItem, suggestions } from "~/utils/suggestions";

export interface HintOpts {
    fill?: string[];
    hint?: string[];
    where?: (payload: Record<string, unknown>) => boolean;
}

export interface EventHints {
    hints: (field: string, opts?: HintOpts) => SuggestOption[];
    fillFrom: (field: string, value: string, opts: HintOpts) => void;
}

export function useEventHints(type: Ref<string | undefined>, form: EventForm, enabled: boolean): EventHints {
    const db = useDb();
    const history = shallowRef<HistoryItem[]>([]);

    onMounted(async () => {
        if (!type.value || !enabled) return;
        if (type.value === "queen_change") {
            const queens = await db.queen.filter((q) => !q.deletedAt).toArray();
            history.value = queens.map((q) => ({ occurredAt: new Date(0), payload: { breed: q.breed } }));
            return;
        }
        history.value = await db.event
            .where("type")
            .equals(type.value)
            .filter((e) => !e.deletedAt)
            .toArray();
    });

    function suggest(field: string, opts: HintOpts) {
        const rows = opts.where ? history.value.filter((e) => opts.where?.(e.payload)) : history.value;
        return suggestions(rows, field, opts.fill);
    }

    function hints(field: string, opts: HintOpts = {}): SuggestOption[] {
        return suggest(field, opts).map((s) => ({
            value: s.value,
            hint:
                (opts.hint ?? [])
                    .map((k) => s.fill[k])
                    .filter(Boolean)
                    .join(" · ") || undefined,
        }));
    }

    function fillFrom(field: string, value: string, opts: HintOpts): void {
        const found = suggest(field, opts).find((s) => s.value === value.trim());
        if (!found) return;
        for (const [k, v] of Object.entries(found.fill)) {
            if (!form[k as keyof EventForm]) form[k as keyof EventForm] = v;
        }
    }

    return { hints, fillFrom };
}
