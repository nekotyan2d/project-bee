export default defineNuxtPlugin(() => {
    const { getToken } = useAuthToken();
    const { flush, pull } = useSync();

    if (getToken()) {
        void (async () => {
            await flush();
            await pull();
        })();
    }

    window.addEventListener("online", () => {
        if (getToken()) void flush();
    });
});
