import type { VNode,  } from "./vnode";
import { isVNode } from "./vnode";
import { isArray, isObject } from "@vue-mini/shared";
import { createVNode } from "./createVNode";

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  const l = arguments.length;

  // === 情况一：只有两个参数 ===
  // 可能写法 1: h('div', { id: 'foo' })       -> 第二个是 Props
  // 可能写法 2: h('div', [ h('span') ])       -> 第二个是 Children (数组)
  // 可能写法 3: h('div', 'hello world')       -> 第二个是 Children (文本)
  // 可能写法 4: h('div', h('span'))           -> 第二个是 Children (VNode)
  if (l === 2) {
    // 关键判断：如果它是对象，且不是数组
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // ⚠️ 极其重要的边缘情况：VNode 本质也是对象！
      // 如果第二个参数是 VNode，说明它是子节点，而不是属性
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      // 否则，它是属性 (props)
      return createVNode(type, propsOrChildren);
    } else {
      // 如果是数组 或 字符串/数字，那肯定是子节点
      return createVNode(type, null, propsOrChildren);
    }
  } 
  
  // === 情况二：三个及以上参数 ===
  else {
    // 如果参数多于 3 个，比如 h('div', {}, 'a', 'b', 'c')
    if (l > 3) {
      // 把从第 3 个参数开始的所有参数，收集成一个数组
      children = Array.prototype.slice.call(arguments, 2);
    } 
    // 如果正好 3 个，且第三个参数是 VNode，为了方便处理，包裹成数组
    else if (l === 3 && isVNode(children)) {
      children = [children];
    }

    // 此时 propsOrChildren 肯定是 props，children 肯定是 children
    return createVNode(type, propsOrChildren, children);
  }
}