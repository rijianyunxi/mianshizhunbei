import { isString } from "@vue-mini/shared"

export function patchStyle(el: Element, prev: any, next: any) {
    const style = (el as HTMLElement).style
    const isCssString = isString(next) // 支持 :style="'color: red'"

    if (next && !isCssString) {
        // 1. 设置新的样式
        for (const key in next) {
            setStyle(style, key, next[key])
        }

        // 2. 清理旧的样式
        // 如果旧的有，新的没有，由于 Vue 的响应式机制，需要手动移除
        if (prev && !isString(prev)) {
            for (const key in prev) {
                if (next[key] == null) {
                    setStyle(style, key, '')
                }
            }
        }
    } else {
        // 如果 next 是字符串，或者 next 为空，直接覆盖整个 cssText
        // const currentDisplay = style.display;
        // if (currentDisplay) {
        //     style.display = currentDisplay // 3. 如果之前有 display，必须给它还原回去
        // }
        if (isCssString) {
            if (prev !== next) {
                style.cssText = next as string
            }
        } else if (prev) {
            // next 为空，移除 style 属性
            el.removeAttribute('style')
        }
    }
}

function setStyle(style: CSSStyleDeclaration, name: string, val: string | string[]) {
    // 这里会有自动加 px 后缀、处理 !important 等逻辑，简化展示：
    if (val == null) val = '';
    (style as any)[name] = val
}