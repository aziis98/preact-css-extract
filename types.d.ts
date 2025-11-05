declare module "css-extract" {
    /**
     * A template literal tag function for defining CSS styles.
     * The CSS will be extracted during build and injected at the @extracted-css directive.
     *
     * @example
     * ```ts
     * import { css } from 'css-extract';
     *
     * const styles = css`
     *   .button {
     *     background: blue;
     *     color: white;
     *   }
     * `;
     * ```
     */
    export function css(strings: TemplateStringsArray, ...values: any[]): string
}
