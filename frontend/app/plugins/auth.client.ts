export default defineNuxtPlugin(async () => {
    const config = useRuntimeConfig();
    const { getToken, setToken } = useAuthToken();

    if (getToken()) return;

    try {
        const response = await fetch(`${config.public.apiBase}/auth/anonymous`, {
            method: "POST",
        });

        if (!response.ok) return;

        const data = (await response.json()) as { token: string };
        setToken(data.token);
    } catch {
        // backend unavailable — app works offline, token will be obtained later
    }
});
