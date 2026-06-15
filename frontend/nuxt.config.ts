// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/eslint", "@nuxtjs/color-mode", "@nuxt/icon"],
    css: ["~/assets/scss/app.scss"],
    ssr: false,
    colorMode: {
        preference: "system",
        fallback: "light",
        dataValue: "theme",
        classSuffix: "",
        storageKey: "theme",
    },
    app: {
        head: {
            viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
            meta: [
                { name: "theme-color", content: "#fafaf9", media: "(prefers-color-scheme: light)" },
                { name: "theme-color", content: "#0c0a09", media: "(prefers-color-scheme: dark)" },
            ],
        },
    },
    runtimeConfig: {
        public: {
            apiBase: "http://localhost:8000",
        },
    },
    eslint: {
        config: {
            stylistic: false,
        },
    },
});
