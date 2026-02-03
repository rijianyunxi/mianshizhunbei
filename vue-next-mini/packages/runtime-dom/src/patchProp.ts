
import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/events'
// import { patchDOMProp } from './modules/props'
// import { patchAttr } from './modules/attrs'
import { isOn } from '@vue-mini/shared'

export const patchProp = (
    el: Element,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG: boolean = false
) => {
    if (key === 'class') {
        // 1. 处理 Class (最快路径)
        patchClass(el, nextValue, isSVG)
    } else if (key === 'style') {
        // 2. 处理 Style
        patchStyle(el, prevValue, nextValue)
    } else if (isOn(key)) {
        // 3. 处理事件 (以 on 开头，如 onClick)
        // isOn 的实现就是 /^on[^a-z]/.test(key)
        patchEvent(el, key, prevValue, nextValue)
    }


    //    else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
    //     // 4. 处理 DOM Property (如 input.value, video.muted)
    //     patchDOMProp(el, key, nextValue)
    //   } else {
    //     // 5. 处理普通 HTML Attribute (如 id, aria-*, custom-attr)
    //     patchAttr(el, key, nextValue, isSVG)
    //   }
}