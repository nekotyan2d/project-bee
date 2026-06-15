const TOKEN_KEY = "token";

export function useAuthToken() {
    function getToken(): string | null {
        if (!import.meta.client) return null;
        return localStorage.getItem(TOKEN_KEY);
    }

    function setToken(value: string): void {
        localStorage.setItem(TOKEN_KEY, value);
    }

    return { getToken, setToken };
}