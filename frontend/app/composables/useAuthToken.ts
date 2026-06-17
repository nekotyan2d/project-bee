const TOKEN_KEY = "token";
const CACHED_EMAIL_KEY = "cachedEmail";

export function useAuthToken() {
    function getToken(): string | null {
        if (!import.meta.client) return null;
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(value: string): void {
        localStorage.setItem(TOKEN_KEY, value);
    }

    function clearToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    function getCachedEmail(): string | null {
        if (!import.meta.client) return null;
        return localStorage.getItem(CACHED_EMAIL_KEY);
    }

    function setCachedEmail(email: string | null): void {
        if (email) localStorage.setItem(CACHED_EMAIL_KEY, email);
        else localStorage.removeItem(CACHED_EMAIL_KEY);
    }

    function clearCachedEmail(): void {
        localStorage.removeItem(CACHED_EMAIL_KEY);
    }

    return { getToken, setToken, clearToken, getCachedEmail, setCachedEmail, clearCachedEmail };
}
