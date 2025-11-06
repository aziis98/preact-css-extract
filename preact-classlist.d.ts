declare global {
    import type { ClassValue } from "clsx"

    namespace preact.JSX {
        interface HTMLAttributes {
            classList?: ClassValue
        }
    }
}

export {}
