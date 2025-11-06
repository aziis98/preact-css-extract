import clsx from "clsx"
import { options } from "preact"

const originalVnodeHook = options.vnode

// Extend Preact's options to include a "classList={...}" that maps to class={clsx(...)}
export const setupPreactClasslist = (): void => {
    options.vnode = vnode => {
        const props = vnode.props as any

        if (props["classList"]) {
            const classList = props["classList"]
            delete props["classList"]

            props.class = clsx(props.class, classList)
        }

        if (originalVnodeHook) {
            originalVnodeHook(vnode)
        }
    }
}
