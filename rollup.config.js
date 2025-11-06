import typescript from "@rollup/plugin-typescript"
import dts from "rollup-plugin-dts"

export default [
    {
        input: "index.ts",
        output: {
            file: "dist/index.js",
            format: "es",
            sourcemap: true,
        },
        external: ["preact", "clsx"],
        plugins: [
            typescript({
                tsconfig: false,
                compilerOptions: {
                    declaration: false,
                    declarationMap: false,
                    sourceMap: true,
                    target: "ES2020",
                    module: "ES2020",
                    lib: ["ES2020"],
                    jsx: "react-jsx",
                    jsxImportSource: "preact",
                    moduleResolution: "node",
                    strict: true,
                    skipLibCheck: true,
                    allowSyntheticDefaultImports: true,
                },
            }),
        ],
    },
    {
        input: "preact-classlist.ts",
        output: {
            file: "dist/preact-classlist.js",
            format: "es",
            sourcemap: true,
        },
        external: ["preact", "clsx"],
        plugins: [
            typescript({
                tsconfig: false,
                compilerOptions: {
                    declaration: false,
                    sourceMap: true,
                    target: "ES2020",
                    module: "ES2020",
                    lib: ["ES2020"],
                    jsx: "react-jsx",
                    jsxImportSource: "preact",
                    moduleResolution: "node",
                    strict: true,
                    skipLibCheck: true,
                    allowSyntheticDefaultImports: true,
                },
            }),
        ],
    },
    {
        input: "plugin.ts",
        output: {
            file: "dist/plugin.js",
            format: "es",
            sourcemap: true,
        },
        external: ["vite", "fs/promises"],
        plugins: [
            typescript({
                tsconfig: false,
                compilerOptions: {
                    declaration: false,
                    sourceMap: true,
                    target: "ES2020",
                    module: "ES2020",
                    lib: ["ES2020"],
                    moduleResolution: "node",
                    strict: true,
                    skipLibCheck: true,
                    allowSyntheticDefaultImports: true,
                },
            }),
        ],
    },
    {
        input: "css-extract-plugin.ts",
        output: {
            file: "dist/css-extract-plugin.js",
            format: "es",
            sourcemap: true,
        },
        external: ["vite", "fs/promises"],
        plugins: [
            typescript({
                tsconfig: false,
                compilerOptions: {
                    declaration: false,
                    sourceMap: true,
                    target: "ES2020",
                    module: "ES2020",
                    lib: ["ES2020"],
                    moduleResolution: "node",
                    strict: true,
                    skipLibCheck: true,
                    allowSyntheticDefaultImports: true,
                },
            }),
        ],
    },
    {
        input: "comptime/index.ts",
        output: {
            file: "dist/comptime/index.js",
            format: "es",
            sourcemap: true,
        },
        external: [],
        plugins: [
            typescript({
                tsconfig: false,
                compilerOptions: {
                    declaration: false,
                    sourceMap: true,
                    target: "ES2020",
                    module: "ES2020",
                    lib: ["ES2020"],
                    moduleResolution: "node",
                    strict: true,
                    skipLibCheck: true,
                    allowSyntheticDefaultImports: true,
                },
            }),
        ],
    },
    // Generate declaration files (.d.ts)
    {
        input: "index.ts",
        output: { file: "dist/index.d.ts", format: "es" },
        plugins: [dts()],
    },
    {
        input: "preact-classlist.ts",
        output: { file: "dist/preact-classlist.d.ts", format: "es" },
        plugins: [dts()],
    },
    {
        input: "plugin.ts",
        output: { file: "dist/plugin.d.ts", format: "es" },
        plugins: [dts()],
    },
    {
        input: "css-extract-plugin.ts",
        output: { file: "dist/css-extract-plugin.d.ts", format: "es" },
        plugins: [dts()],
    },
    {
        input: "comptime/index.ts",
        output: { file: "dist/comptime/index.d.ts", format: "es" },
        plugins: [dts()],
    },
]
