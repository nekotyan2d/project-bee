export default defineNuxtPlugin(() => {
    const { flush, pull } = useSync();

    void (async () => {
        await flush();
        await pull();
    })();

    window.addEventListener("online", () => void flush());
});
