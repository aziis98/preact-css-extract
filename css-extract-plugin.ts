import { readFile } from "node:fs/promises"
import { type PluginOption } from "vite"

const CSS_TEMPLATE_LITERAL_REGEX = /css\`([^\`]*)\`/gs
const CSS_COMPTIME = "@aziis98/preact-css-extract/comptime"
const CSS_COMPTIME_RESOLVED = "\0" + CSS_COMPTIME

function hashCSS(cssContent: string) {
    const hash = Array.from(cssContent.replace(/\s+/g, " ")).reduce(
        (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
        0
    )
    return Math.abs(hash).toString(36)
}

function generateCSS(cssContent: string) {
    const className = "css-" + hashCSS(cssContent)
    const wrappedCss = `.${className} {\n${cssContent}\n}`
    return { className, wrappedCss }
}

export const cssExtractPlugin = (): PluginOption => {
    const collectedStyles = new Map()

    const filesContainingCssTemplateLiterals: Set<string> = new Set()
    let cssFilePaths: Set<string> = new Set()

    return [
        {
            name: "vite-plugin-css-extract",

            resolveId(id) {
                // console.log("Resolving ID:", id)

                // Resolve the "@aziis98/preact-css-extract/comptime" virtual module
                if (id === CSS_COMPTIME) {
                    return CSS_COMPTIME_RESOLVED
                }
            },

            async load(id) {
                // console.log("Loading module ID:", id)

                if (id === CSS_COMPTIME_RESOLVED) {
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

                // Collect css template literal usages in JS/TS files
                if (id.match(/\.(js|jsx|ts|tsx)$/) && !id.includes("node_modules")) {
                    const source = await readFile(id, "utf-8")

                    // console.log("Collecting CSS usages from file:", id)
                    let match

                    while ((match = CSS_TEMPLATE_LITERAL_REGEX.exec(source)) !== null) {
                        filesContainingCssTemplateLiterals.add(id)

                        const cssContent = match[1] || ""

                        const { className, wrappedCss } = generateCSS(cssContent)
                        collectedStyles.set(className, wrappedCss)

                        // console.log(`Collected CSS for class ${className} from file ${id}`)
                    }
                }

                if (id.match(/\.css$/)) {
                    const source = await readFile(id, "utf-8")
                    if (source.includes("@extracted-css")) {
                        cssFilePaths.add(id)
                        // console.log("Registered CSS file for extraction:", id)
                    }
                }

                return null
            },

            transform(code, id) {
                if (id.match(/\.(js|jsx|ts|tsx)$/) && !id.includes("node_modules")) {
                    // console.log("Transforming JS/TS file for CSS extraction:", id)

                    let match
                    let transformedCode = code

                    while ((match = CSS_TEMPLATE_LITERAL_REGEX.exec(code)) !== null) {
                        const cssContent = match[1] || ""

                        const { className, wrappedCss } = generateCSS(cssContent)
                        collectedStyles.set(className, wrappedCss)

                        // console.log(`Extracted CSS for class ${className} from file ${id}`)

                        transformedCode = transformedCode.replace(match[0], `'${className}'`)
                    }

                    return transformedCode !== code ? transformedCode : null
                }

                if (id.match(/\.css$/) && code.includes("@extracted-css")) {
                    // console.log("Transforming CSS file for @extracted-css:", id)
                    // console.log("Collected styles:", collectedStyles)

                    filesContainingCssTemplateLiterals.forEach(file => {
                        this.addWatchFile(file)
                    })

                    const combinedStyles = Array.from(collectedStyles.values()).join("\n\n")
                    return code.replace("@extracted-css", combinedStyles)
                }

                return null
            },
        },
    ]
}
