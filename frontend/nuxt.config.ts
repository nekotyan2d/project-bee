// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: ["@nuxt/eslint", "@nuxtjs/color-mode", "@nuxt/icon", "@vite-pwa/nuxt"],
    css: ["~/assets/scss/app.scss"],
    ssr: false,
    nitro: {
        preset: "static",
    },
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
                { name: "theme-color", content: "#fffbff", media: "(prefers-color-scheme: light)" },
                { name: "theme-color", content: "#1f1b16", media: "(prefers-color-scheme: dark)" },
            ],
        },
    },
    icon: {
        clientBundle: {
            scan: true,
        },
    },
    runtimeConfig: {
        public: {
            apiBase: "http://localhost:8000",
        },
    },
    pwa: {
        registerType: "prompt",
        manifest: {
            name: "Пасека",
            short_name: "Пасека",
            description: "Учёт пасеки",
            theme_color: "#fffbff",
            background_color: "#fffbff",
            display: "standalone",
            start_url: "/",
        },
        pwaAssets: {
            image: "public/icon.svg",
        },
        workbox: {
            navigateFallback: "/",
            globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        },
        devOptions: {
            enabled: true,
            type: "module",
        },
    },
    eslint: {
        config: {
            stylistic: false,
        },
    },
    devServer: {
        port: 3000,
    },
});
