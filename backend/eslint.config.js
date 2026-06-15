import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
    { ignores: ["node_modules", "dist", "drizzle"] },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            boundaries,
            perfectionist,
        },
        settings: {
            "import/resolver": {
                typescript: { project: "./tsconfig.json" },
            },
            "boundaries/include": ["src/**"],
            "boundaries/elements": [
                { type: "shared", mode: "full", pattern: "src/shared/**" },
                {
                    type: "handler",
                    mode: "file",
                    pattern: "src/features/*/handler.ts",
                    capture: ["feature"],
                },
                {
                    type: "handler",
                    mode: "full",
                    pattern: "src/features/*/handler/**",
                    capture: ["feature"],
                },
                {
                    type: "service",
                    mode: "file",
                    pattern: "src/features/*/service.ts",
                    capture: ["feature"],
                },
                {
                    type: "service",
                    mode: "full",
                    pattern: "src/features/*/service/**",
                    capture: ["feature"],
                },
                {
                    type: "repository",
                    mode: "file",
                    pattern: "src/features/*/repository.ts",
                    capture: ["feature"],
                },
                {
                    type: "repository",
                    mode: "full",
                    pattern: "src/features/*/repository/**",
                    capture: ["feature"],
                },
            ],
        },
        rules: {
            "boundaries/no-unknown": "off",
            "boundaries/no-private": "off",
            "boundaries/dependencies": [
                "error",
                {
                    default: "disallow",
                    rules: [
                        {
                            from: { type: "handler" },
                            allow: {
                                to: [
                                    { type: "shared" },
                                    { type: "handler", captured: { feature: "{{from.feature}}" } },
                                    { type: "service", captured: { feature: "{{from.feature}}" } },
                                ],
                            },
                        },
                        {
                            from: { type: "service" },
                            allow: {
                                to: [
                                    { type: "shared" },
                                    { type: "service", captured: { feature: "{{from.feature}}" } },
                                    {
                                        type: "repository",
                                        captured: { feature: "{{from.feature}}" },
                                    },
                                ],
                            },
                        },
                        {
                            from: { type: "repository" },
                            allow: {
                                to: [
                                    { type: "shared" },
                                    {
                                        type: "repository",
                                        captured: { feature: "{{from.feature}}" },
                                    },
                                ],
                            },
                        },
                        {
                            from: { type: "shared" },
                            allow: { to: { type: "shared" } },
                        },
                    ],
                },
            ],
            "perfectionist/sort-imports": [
                "error",
                {
                    type: "natural",
                    order: "asc",
                    newlinesBetween: 1,
                    internalPattern: ["^@/.*"],
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        ["parent", "sibling", "index"],
                    ],
                },
            ],
        },
    },
    {
        files: ["**/*.config.{js,ts}"],
        rules: {
            ...tseslint.configs.disableTypeChecked.rules,
            "boundaries/dependencies": "off",
        },
    },
];
