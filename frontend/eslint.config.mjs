// @ts-check
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
    {
        name: "project/ignores",
        ignores: ["app/shared/api/schema.d.ts", "pwa-assets.config.ts"],
    },
    ...tseslint.configs.strictTypeChecked,
    {
        name: "project/typed-parser-options",
        files: ["**/*.{ts,tsx,mts,cts}"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        name: "project/vue-typed-parser",
        files: ["**/*.vue"],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                projectService: true,
                extraFileExtensions: [".vue"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        name: "project/import-sorting",
        plugins: { perfectionist },
        rules: {
            "perfectionist/sort-imports": [
                "error",
                {
                    type: "natural",
                    newlinesBetween: 1,
                    internalPattern: ["^~/.*", "^@/.*"],
                    groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
                },
            ],
        },
    },
    {
        name: "project/disable-typed-for-js",
        files: ["**/*.{js,mjs,cjs}"],
        rules: { ...tseslint.configs.disableTypeChecked.rules },
    },
)
