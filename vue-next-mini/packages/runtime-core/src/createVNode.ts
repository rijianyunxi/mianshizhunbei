import { ShapeFlags, isString, isObject } from "@vue-mini/shared";
import type { VNode } from "./vnode";
export const createVNode = (
  type: any,
  props: any = null,
  children: any = null
): VNode => {
  // 1. 核心逻辑：通过 type 推断 ShapeFlag (是普通元素还是组件？)
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  // 2. 创建 VNode 对象
  const vnode: VNode = {
    __v_isVNode: true, // 内部属性，标识这是一个 VNode
    type,
    props,
    children,
    shapeFlag,
    el: null, // 真实 DOM，挂载后才有值
    key: props && props.key, // 提取 key 用于 Diff
    component: null, // 组件实例
  };

  // 3. 核心逻辑：规范化 children 并更新 ShapeFlag
  normalizeChildren(vnode, children);

  return vnode;
};

// 辅助函数：根据 children 的类型，打上 TEXT_CHILDREN 或 ARRAY_CHILDREN 标记
function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0;
  const { shapeFlag } = vnode;

  if (children == null) {
    children = null;
  } else if (Array.isArray(children)) {
    // 情况 A: children 是数组 -> 标记为 ARRAY_CHILDREN
    type = ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === "object") {
    // 情况 B: children 是对象 (通常是 Slot 或单个 VNode)
    // Mini-vue 暂时简化，如果是组件且 children 是对象，这里可以处理 Slot
    // 如果 children 是 VNode，通常在 h 函数里已经被包裹成数组了
    // 这里暂时不做复杂处理
  } else {
    // 情况 C: children 是字符串/数字 -> 标记为 TEXT_CHILDREN
    children = String(children);
    type = ShapeFlags.TEXT_CHILDREN;
  }

  // 更新 children 的值 (例如把数字转成了字符串)
  vnode.children = children;
  
  // 使用位运算 (按位或 |) 追加标记
  // 此时 shapeFlag 可能变成了: ELEMENT | TEXT_CHILDREN (即 1 | 8 = 9)
  vnode.shapeFlag |= type;
}