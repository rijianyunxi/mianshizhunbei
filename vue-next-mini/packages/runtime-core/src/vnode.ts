// import { ShapeFlags } from "@vue-mini/shared";

// VNode 也就是虚拟节点，它本质就是一个普通的 JS 对象
export interface VNode {
  // === 核心属性 ===
  
  // 1. 节点类型
  // 如果是 html 标签，它是 string ('div')
  // 如果是组件，它是组件对象 ({ setup: ... })
  // 如果是文本，它是 Symbol
  type: any;

  // 2. 属性 (props, attrs, events, class, style)
  props: any;

  // 3. 子节点 (字符串、数组、或插槽对象)
  children: string | VNode[] | null;

  // 4. 真实 DOM 引用 (用于 Diff 过程中的直接操作)
  // 在 mount 阶段会被赋值
  el: any | null; 

  // 5. 唯一标识 (用于 List Diff 优化)
  key: string | number | null;

  // === 标记属性 ===

  // 6. 形状标记 (位运算核心，标识它是元素还是组件，子节点是文本还是数组)
  shapeFlag: number;

  // 7. 组件实例引用 (只有当 type 是组件时才有值)
  // 用于在更新组件时找到对应的 instance
  component: any | null; 
}