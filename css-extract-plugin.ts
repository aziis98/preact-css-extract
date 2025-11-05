import { type Plugin } from "vite"

export const cssExtractPlugin = (): Plugin => {
    const virtualModuleId = "@aziis98/preact-css-extract/comptime"
    const resolvedVirtualModuleId = "\0" + virtualModuleId

    const collectedStyles = new Map()
    let cssFilePaths: Set<string> = new Set()

    function generateClassName(cssContent: string) {
        const hash = Array.from(cssContent.replace(/\s+/g, " ")).reduce(
            (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
            0
        )
        return `css-${Math.abs(hash).toString(36)}`
    }

    function processCss(cssContent: string) {
        const className = generateClassName(cssContent)
        const wrappedCss = `.${className} {\n${cssContent}\n}`
        return { className, wrappedCss }
    }

    return {
        name: "vite-plugin-css-extract",

        async handleHotUpdate(ctx) {
            console.log("Handling HMR for:", ctx.file)

            // Track CSS files that contain @extracted-css
            if (ctx.file.endsWith(".css") && ctx.read) {
                const content = await ctx.read()
                if (typeof content === "string" && content.includes("@extracted-css")) {
                    cssFilePaths.add(ctx.file)
                }
            }

            // When a JS/TS file changes, invalidate all CSS files with @extracted-css
            if (ctx.file.match(/\.(js|jsx|ts|tsx)$/) && !ctx.file.includes("node_modules")) {
                if (cssFilePaths.size > 0) {
                    // Invalidate all CSS files to trigger their re-transformation
                    for (const cssFile of cssFilePaths) {
                        const cssModule = ctx.server.moduleGraph.getModuleById(cssFile)
                        if (cssModule) {
                            ctx.server.moduleGraph.invalidateModule(cssModule)
                        }
                    }
                }
            }
        },

        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId
            }
        },

        load(id) {
            if (id === resolvedVirtualModuleId) {
                return `
                    export function css(strings, ...values) {
                        let result = strings[0];
                        for (let i = 0; i < values.length; i++) {
                            result += values[i] + strings[i + 1];
                        }

                        const hash = Array.from(result.replace(/\\s+/g, ' '))
                            .reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)
                            .toString(36);

                        return 'css-' + hash;
                    }
                `
            }
        },

        transform(code, id) {
            if (id.match(/\.(js|jsx|ts|tsx)$/) && !id.includes("node_modules")) {
                const cssRegex = /css\`([^\`]*)\`/gs
                let match
                let transformedCode = code

                while ((match = cssRegex.exec(code)) !== null) {
                    const cssContent = match[1] || ""
                    const { className, wrappedCss } = processCss(cssContent)
                    collectedStyles.set(className, wrappedCss)
                    transformedCode = transformedCode.replace(match[0], `'${className}'`)
                }

                return transformedCode !== code ? transformedCode : null
            }

            if (id.match(/\.css$/) && code.includes("@extracted-css")) {
                const combinedStyles = Array.from(collectedStyles.values()).join("\n\n")
                return code.replace("@extracted-css", combinedStyles)
            }

            return null
        },
    }
}
