import createClient, { type Middleware } from "openapi-fetch";

import type { paths } from "~/shared/api/schema";

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const { getToken } = useAuthToken();

    const authMiddleware: Middleware = {
        onRequest({ request }) {
            const token = getToken();
            if (token) {
                request.headers.set("Authorization", `Bearer ${token}`);
            }
            return request;
        },
    };

    const api = createClient<paths>({ baseUrl: config.public.apiBase });
    api.use(authMiddleware);

    return { provide: { api } };
});
