export default defineNuxtPlugin(() => {
    const { getToken } = useAuthToken();
    const { flush, pull } = useSync();

    async function sync(): Promise<void> {
        if (!getToken()) return;
        await flush();
        await pull();
    }

    void sync();

    window.addEventListener("online", () => void sync());
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") void sync();
    });
});
