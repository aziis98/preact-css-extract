import { readFile } from "fs/promises"
import { type PluginOption } from "vite"

const REGEX_JS_COMMENT = /\/\*[\s\S]*?\*\/|\/\/.*/g
const REGEX_CSS_TEMPLATE_LITERAL = /css\`([^\`]*)\`/gs

const CSS_COMPTIME = "preact-css-extract/comptime"
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

    // console.log("Initializing cssExtractPlugin")

    return [
        {
            name: "vite-plugin-css-extract",

            resolveId(id) {
                // console.log("Resolving ID:", id)

                // Resolve the "preact-css-extract/comptime" virtual module
                if (id === CSS_COMPTIME) {
                    return CSS_COMPTIME_RESOLVED
                }
            },

            async load(id) {
                // console.log("Loading module ID:", id)

                if (id === CSS_COMPTIME_RESOLVED) {
                    return `export const css = () => "css-comptime-placeholder";`
                }

                // Collect css template literal usages in JS/TS files
                if (id.match(/\.(js|jsx|ts|tsx)$/) && !id.includes("node_modules")) {
                    let source = await readFile(id, "utf-8")

                    source = source.replace(REGEX_JS_COMMENT, "")

                    // console.log("Collecting CSS usages from file:", id)
                    let match

                    while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(source)) !== null) {
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
                    // console.log("[Transform] ", id)
                    // console.log(`Code before transformation:\n`, code)

                    let match
                    let transformedCode = code

                    while ((match = REGEX_CSS_TEMPLATE_LITERAL.exec(code)) !== null) {
                        const cssContent = match[1] ?? ""

                        const { className, wrappedCss } = generateCSS(cssContent)
                        collectedStyles.set(className, wrappedCss)

                        // console.log(`Match (classname: "${className}"):\n`, match[0])

                        transformedCode = transformedCode.replace(match[0], `"${className}"`)
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
