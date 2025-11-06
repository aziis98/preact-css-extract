import { type ModuleNode, type PluginOption } from "vite"

export const cssExtractPlugin = (): PluginOption => {
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

    return [
        {
            name: "vite-plugin-css-extract:collect-styles",

            async handleHotUpdate({ server, modules, timestamp }) {
                const invalidatedModules = new Set<ModuleNode>()

                if (modules.some(m => m.id && m.id.match(/\.(js|jsx|ts|tsx)$/) && !m.id.includes("node_modules"))) {
                    for (const cssFile of cssFilePaths) {
                        const cssModule = server.moduleGraph.getModuleById(cssFile)
                        if (cssModule) {
                            server.moduleGraph.invalidateModule(cssModule, invalidatedModules, timestamp, true)
                        }
                    }
                }

                return modules
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

            transform: {
                order: "pre",
                handler(code, id) {
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

                    // if (id.match(/\.css$/) && code.includes("@extracted-css")) {
                    //     // console.log("Transforming CSS file for @extracted-css:", id)
                    //     cssFilePaths.add(id)

                    //     const combinedStyles = Array.from(collectedStyles.values()).join("\n\n")
                    //     return code.replace("@extracted-css", combinedStyles)
                    // }

                    return null
                },
            },
        },
        {
            name: "vite-plugin-css-extract:extract-styles",
            transform: {
                order: "post",
                handler(code, id) {
                    if (id.match(/\.css$/) && code.includes("@extracted-css")) {
                        // console.log("Post-transforming CSS file for @extracted-css:", id)
                        const combinedStyles = Array.from(collectedStyles.values()).join("\n\n")
                        return code.replace("@extracted-css", combinedStyles)
                    }
                    return null
                },
            },
        },
    ]
}
