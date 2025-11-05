# preact-css-extract

[![JSR](https://jsr.io/badges/@aziis98/preact-css-extract)](https://jsr.io/package/@aziis98/preact-css-extract)

This package provides the following two main features: a vite plugin for compile-time css extraction and a custom preact `classList` prop integration based on `clsx`.

This is inspired by EmotionCSS (that is a bit outdated to my understanding and it doesn't support ViteJS and Preact together) and VueJS class attributes. Also I don't want to use heavy css-in-js solutions or TailwindCSS (for [various](https://www.aleksandrhovhannisyan.com/blog/why-i-dont-like-tailwind-css/) [reasons](https://jakelazaroff.com/words/tailwind-is-a-leaky-abstraction/)).

## Overview

This project provides tools for managing component styling at build time while maintaining a clean, developer-friendly API. It includes:

1. **CSS Extract Plugin**: A Vite plugin that processes template literal CSS declarations and extracts them into a central stylesheet during compilation.

2. **Preact `classList` Helper**: A Preact ["option hook"](https://preactjs.com/guide/v10/options) integration that extends the component props API with a `classList` attribute that forwards class names to the `clsx` library for conditional class composition.

## Usage Example

### CSS Extraction with Template Literals

Define styles using the `css` template literal in your component files:

```tsx
import { css } from "@aziis98/preact-css-extract/comptime"

const buttonStyles = css`
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
`

export function Button() {
    return <button class={buttonStyles}>Click me</button>
}
```

You can also put css template literals directly in the `class` attribute:

```tsx
export function Alert() {
    return (
        <div
            class={css`
                padding: 12px;
                background-color: orangered;
                color: white;
                border-radius: 4px;

                &:hover {
                    background-color: red;
                }
            `}
        >
            Warning!
        </div>
    )
}
```

The plugin processes these CSS declarations at build time, generates a unique class name based on the content hash (like `css-1a2b3c`), and injects all styles where the `@extracted-css` directive is placed in your css files.

Example usage in a css file:

```css
@layer base, components, utilities;

@layer base {
    body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background-color: #f0f0f0;
    }
}

@layer components {
    @extracted-css;
}

@layer utilities {
    .font-bold {
        font-weight: bold;
    }
}
```

### ClassList Attribute

To enable the Preact `clsx` integration with the `classList` attribute, set it up as follows. In your application entry point, add:

```tsx
import { setupPreactClasslist } from "@aziis98/preact-css-extract"

setupPreactClasslist()
```

And add a `types.d.ts` file to your project with the following content to extend the Preact JSX types:

```ts
/// <reference path="../node_modules/@aziis98/preact-css-extract/global.d.ts" />
```

Then use the `classList` prop with object notation, here is an example:

```tsx
...
<span
    classList={[
        css`
            margin: 0 2rem;
            font-size: 2rem;
        `,
        counter % 2 === 0 && "font-bold",
    ]}
>
    {counter}
</span>
...
```

This automatically merges with any existing `class` prop using clsx for proper class concatenation.

## Installation

This package is hosted on JSR<sup>1</sup> and can be installed via npm, yarn, pnpm, or bun:

```bash
npx jsr add @aziis98/preact-css-extract
# or
yarn jsr add @aziis98/preact-css-extract
pnpm jsr add @aziis98/preact-css-extract
bunx jsr add @aziis98/preact-css-extract
```

<sup>1</sup>Please somebody explain to me how to package things like this to npm without going mad...

## Plugin Setup

To set up the CSS Extract Plugin in your Vite configuration, add the following to your `vite.config.ts` or `vite.config.js`:

```ts
import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import { cssExtractPlugin } from "@aziis98/preact-css-extract"

export default defineConfig({
    plugins: [preact(), cssExtractPlugin()],
})
```

## Caveats

For my needs this is already completely on par with the TailwindCSS "experience" of writing styles near your components, however there are some caveats to be aware of:

-   For now I've kept the generated css very simple, there is no added scoping or style collision prevention. This means that if you have two components that generate the same css, they will share the same class name. This is not necessarily a bad thing, but something to be aware of.

-   The CSS extraction is currently based on a simple regular expression. This means that the css strings must be known at compile time and cannot be dynamically generated.

    I think this is a reasonable compromise as one can use specialized utility classes as in the example above to dynamically add styles, or just update styles directly with the `style` attribute.

-   CSS snippets are hashed to 6-character class names, I hope its enough to avoid collisions. Fire me an issue if you find any and we'll have a laugh at the examples together...

## Improvements and Future Work

-   Set explicitly the class name of a css snippet, something like:

    ```tsx
    const buttonStyles = css("my-button")`
        background-color: blue;
        color: white;
        ...
    `
    ```

    or just extract the first class present in the css snippet:

    ```tsx
    const buttonStyles = css`
        .my-button {
            background-color: blue;
            color: white;
            ...
        }
    `
    ```

-   Better handling for scoped styles

-   More robust CSS parsing instead of regex-based extraction

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
