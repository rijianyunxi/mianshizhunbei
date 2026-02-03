// packages/shared/src/shapeFlags.ts

export const enum ShapeFlags {
  // 1. 普通 HTML 元素 (div, p, span 等)
  // 二进制: 0000000001 (1)
  ELEMENT = 1,

  // 2. 函数式组件
  // 二进制: 0000000010 (2)
  FUNCTIONAL_COMPONENT = 1 << 1,

  // 3. 有状态组件 (我们平时写的普通组件，有 setup/data/methods)
  // 二进制: 0000000100 (4)
  STATEFUL_COMPONENT = 1 << 2,

  // 4. 子节点是纯文本
  // 二进制: 0000001000 (8)
  TEXT_CHILDREN = 1 << 3,

  // 5. 子节点是数组 (也就是说有多个子节点)
  // 二进制: 0000010000 (16)
  ARRAY_CHILDREN = 1 << 4,

  // 6. 子节点是插槽 (Slots)
  // 二进制: 0000100000 (32)
  SLOTS_CHILDREN = 1 << 5,

  // 7. Teleport (传送门组件)
  TELEPORT = 1 << 6,

  // 8. Suspense (异步依赖组件)
  SUSPENSE = 1 << 7,

  // 9. 组件需要被 KeepAlive 缓存
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,

  // 10. 组件已经被 KeepAlive 缓存
  COMPONENT_KEPT_ALIVE = 1 << 9,

  // === 组合类型 ===
  // 组件 = 有状态组件 | 函数式组件
  // 只要满足其中一个，就认为它是组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT
}