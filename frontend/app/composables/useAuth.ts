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
        if (!getToken()) {
            const anonRes = await fetch(`${base}/auth/anonymous`, { method: "POST" });
            if (!anonRes.ok) throw new Error("Не удалось подготовить аккаунт");
            const anonData = (await anonRes.json()) as { token: string };
            setToken(anonData.token);
        }

        await useSync().pushAll();

        const token = getToken();
        if (!token) throw new Error("Не удалось подготовить аккаунт");
        const res = await fetch(`${base}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    }

    return { me, register, login, logout };
}
