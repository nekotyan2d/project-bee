import { consumeBackNavigation, navDirection } from "~/utils/navDirection";

export default defineNuxtPlugin(() => {
    const router = useRouter();

    type HistoryState = { current?: string; position?: number } | null;
    const state = (): HistoryState => window.history.state as HistoryState;
    let lastPosition = state()?.position ?? 0;

    router.beforeEach((to, from) => {
        let direction = navDirection(from.fullPath, to.fullPath);

        const current = state();
        const isPop = current?.current === to.fullPath && typeof current.position === "number";

        if (consumeBackNavigation()) direction = "back";
        else if (isPop) direction = (current.position as number) < lastPosition ? "back" : "forward";

        document.documentElement.dataset.nav = direction;
    });

    router.afterEach(() => {
        lastPosition = state()?.position ?? lastPosition;
    });
});
