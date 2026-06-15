import { liveQuery } from "dexie";

export function useLiveQuery<T>(querier: () => T | Promise<T>, initialValue: T) {
    const result = shallowRef<T>(initialValue);
    let subscription: { unsubscribe(): void } | null = null;

    onMounted(() => {
        subscription = liveQuery(querier).subscribe({
            next(val) {
                result.value = val;
            },
        });
    });

    onUnmounted(() => subscription?.unsubscribe());

    return result;
}
