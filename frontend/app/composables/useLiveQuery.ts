import { liveQuery } from "dexie";

export function useLiveQuery<T>(querier: () => T | Promise<T>, initialValue: T) {
    const data = shallowRef<T>(initialValue);
    const loading = ref(true);
    let subscription: { unsubscribe(): void } | null = null;

    onMounted(() => {
        subscription = liveQuery(querier).subscribe({
            next(val) {
                data.value = val;
                loading.value = false;
            },
        });
    });

    onUnmounted(() => subscription?.unsubscribe());

    return { data, loading };
}
