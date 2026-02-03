export function patchClass(el: Element, value: string | null, isSVG: boolean) {
  // 如果 value 为 null/undefined，转为空字符串
  const transitionClasses = (el as any)._vtc
  if (transitionClasses) {
      value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(' ')
  }

  if (value == null) {
    el.removeAttribute('class')
  } else if (isSVG) {
    // SVG 的 class 是个对象，不能直接 .className
    el.setAttribute('class', value)
  } else {
    // ⚡️ 性能优化点：直接赋值 className
    el.className = value
  }
}