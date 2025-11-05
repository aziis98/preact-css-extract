/**
 * A template literal tag function for defining CSS styles.
 * The CSS will be extracted during build and injected at the @extracted-css directive.
 *
 * ```ts
 * import { css } from '@aziis98/preact-css-extract'
 *
 * const styles = css`
 *     .button {
 *         background: blue;
 *         color: white;
 *     }
 * `;
 * ```
 */
export function css(_strings: TemplateStringsArray, ..._values: any[]): string {
    // this will be replaced at build time by the vite js plugin
    return "comptime-placeholder"
}
