
import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/events'
import { patchDOMProp } from './modules/props'
import { patchAttr } from './modules/attrs'
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
    }   else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
        // 4. 处理 DOM Property (如 input.value, video.muted)
        patchDOMProp(el, key, nextValue)
      } else {
        // 5. 处理普通 HTML Attribute (如 id, aria-*, custom-attr)
        patchAttr(el, key, nextValue)
      }


    
}


export function shouldSetAsProp(
  el: Element,
  key: string,
  value: unknown,
  isSVG: boolean
) {
  // 1. 特殊情况：SVG 标签基本上都是 Attribute
  // (除了 innerHTML 和 textContent 这种通用属性)
  if (isSVG) {
    return key === 'innerHTML' || key === 'textContent'
  }

  // 2. 特殊情况：'spellcheck', 'draggable' 等
  // 这些虽然在 DOM 对象上有对应属性，但行为诡异，setAttribute 更稳
  if (key === 'spellcheck' || key === 'draggable' || key === 'translate') {
    return false
  }

  // 3. 特殊情况：Form 表单属性
  // input.form 是只读的！不能通过 el.form = xxx 修改，只能 el.setAttribute('form', id)
  if (key === 'form') {
    return false
  }

  // 4. 特殊情况：Input 的 list 属性
  // 也是只读的，必须用 setAttribute
  if (key === 'list' && el.tagName === 'INPUT') {
    return false
  }

  // 5. type 属性
  // 在 textarea 上设置 type 是非法的，必须走 attribute
  if (key === 'type' && el.tagName === 'TEXTAREA') {
    return false
  }

  // 6. === 核心判断 ===
  // 只要 DOM 对象里有这个属性，原则上就优先作为 Property 设置
  // (因为 el.xxx = val 比 setAttribute('xxx', val) 性能好且更符合 JS 逻辑)
  if (key in el) {
    return true
  }

  return false
}