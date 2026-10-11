export function useSafeLogout() {
    const db = useDb();
    const { flush } = useSync();
    const { logout } = useAuth();

    const busy = ref(false);
    const unsent = ref(0);

    async function run(): Promise<void> {
        busy.value = true;

        if (!unsent.value && (await db.outbox.count()) > 0) {
            await flush();
            unsent.value = await db.outbox.count();
            if (unsent.value > 0) {
                busy.value = false;
                return;
            }
        }

        await logout();
        await returnTo("/");
    }

    return { busy, unsent, run };
}
