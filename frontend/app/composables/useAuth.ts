type AuthError = { message?: string };

export function useAuth() {
    const config = useRuntimeConfig();
    const { getToken, setToken, clearToken, getCachedEmail, setCachedEmail, clearCachedEmail } = useAuthToken();
    const db = useDb();
    const base = config.public.apiBase;

    async function parseError(res: Response, fallback: string): Promise<string> {
        try {
            const body = (await res.json()) as AuthError;
            return body.message ?? fallback;
        } catch {
            return fallback;
        }
    }

    async function resetLocalData(): Promise<void> {
        await Promise.all(db.tables.map((t) => t.clear()));
    }

    async function me(): Promise<{ id: string; email: string | null; offline?: boolean } | null> {
        const token = getToken();
        if (!token) return null;
        try {
            const res = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return null;
            const data = (await res.json()) as { id: string; email: string | null };
            setCachedEmail(data.email);
            return data;
        } catch {
            const cachedEmail = getCachedEmail();
            return cachedEmail ? { id: "", email: cachedEmail, offline: true } : null;
        }
    }

    async function register(email: string, password: string): Promise<void> {
        // Сначала гарантируем, что сервер содержит данные (под текущим user_id) — иначе вход
        // с другого устройства подтянет пусто. Падение здесь → аккаунт не создаётся, можно повторить.
        await useSync().pushAll();

        const token = getToken();
        const res = await fetch(`${base}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error(await parseError(res, "Не удалось сохранить аккаунт"));
        const data = (await res.json()) as { token: string };
        setToken(data.token);
    }

    async function login(email: string, password: string): Promise<void> {
        const res = await fetch(`${base}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error(await parseError(res, "Неверная почта или пароль"));
        const data = (await res.json()) as { token: string };
        setToken(data.token);
        await resetLocalData();
        await useSync().pull();
    }

    async function logout(): Promise<void> {
        clearToken();
        clearCachedEmail();
        await resetLocalData();
        const res = await fetch(`${base}/auth/anonymous`, { method: "POST" });
        if (res.ok) {
            const data = (await res.json()) as { token: string };
            setToken(data.token);
        }
    }

    return { me, register, login, logout };
}
