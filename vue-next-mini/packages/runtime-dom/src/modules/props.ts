export function patchDOMProp(el: any, key: string, value: any) {
  // 特殊处理 input 的 value
  if (key === 'value' && el.tagName === 'INPUT') {
      el.value = value == null ? '' : value
      return
  }
  
  // 简单粗暴，直接点操作符赋值
  // 比如 el.checked = true
  // 如果用 setAttribute('checked', true) 是不起作用的
  if (value === '' || value == null) {
      const type = typeof el[key]
       if (type === 'boolean') {
           el[key] = false
           return
       }
  }
  el[key] = value
}