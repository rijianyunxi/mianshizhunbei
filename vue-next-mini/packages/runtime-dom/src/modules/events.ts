export type EventValue = Function | Function[]

interface Invoker extends EventListener {
  value: EventValue
}

export function patchEvent(
  el: Element & { _vei?: Record<string, Invoker | undefined> },
  rawName: string, // 例如 "onClick"
  prevValue: EventValue | null,
  nextValue: EventValue | null
) {
  // 1. 获取缓存 (vei = vue event invokers)
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]

  if (nextValue && existingInvoker) {
    // A. 更新逻辑：最牛的地方！
    // 只要把 invoker.value 换成新的函数即可
    // 不需要 removeEventListener 再 addEventListener
    existingInvoker.value = nextValue
  } else {
    const name = parseName(rawName) // onClick -> click
    
    if (nextValue) {
      // B. 新增逻辑
      // 创建一个 invoker，它是一个包装函数
      const invoker = (invokers[rawName] = createInvoker(nextValue))
      el.addEventListener(name, invoker)
    } else if (existingInvoker) {
      // C. 删除逻辑
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}

function createInvoker(initialValue: EventValue) {
  const invoker: Invoker = (e: Event) => {
    const value = invoker.value
    
    // 1. 先判断是不是数组
    if (Array.isArray(value)) {
      // 如果是数组，遍历执行每一个函数
      value.forEach(fn => fn(e))
    } else {
      // 2. 如果不是数组，那它一定是函数
      // 注意：这里可能还需要加 as Function，因为 TS 的 Function 类型默认不带参数签名
      (value as Function)(e)
    }
  }
  
  invoker.value = initialValue
  return invoker
}


// 解析事件名，例如 onClick -> click
function parseName(rawName: string) {
  return rawName.slice(2).toLowerCase()
}
