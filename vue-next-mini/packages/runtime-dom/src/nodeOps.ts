
// 为了支持 TypeScript 类型，引入一些内置接口
export const svgNS = 'http://www.w3.org/2000/svg'

const doc = (typeof document !== 'undefined' ? document : null) as Document

export const nodeOps = {
  // 1. 插入节点
  // anchor 是锚点，如果为 null，insertBefore 等同于 appendChild
  insert: (child: Node, parent: Node, anchor: Node | null) => {
    parent.insertBefore(child, anchor || null)
  },

  // 2. 移除节点
  remove: (child: Node) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  // 3. 创建元素节点
  // isSVG: 是否是 SVG 标签
  // is: 用于 Web Components 的 is 属性
  createElement: (
    tag: string,
    isSVG?: boolean,
    is?: string,
    props?: Record<string, any>
  ): Element => {
    const el = isSVG
      ? doc.createElementNS(svgNS, tag)
      : doc.createElement(tag, is ? { is } : undefined)

    // 特殊处理 select 标签的多选属性，避免浏览器兼容性问题
    if (tag === 'select' && props && props.multiple != null) {
      ;(el as HTMLSelectElement).setAttribute('multiple', 'multiple')
    }

    return el
  },

  // 4. 创建文本节点
  createText: (text: string): Text => doc.createTextNode(text),

  // 5. 创建注释节点
  createComment: (text: string): Comment => doc.createComment(text),

  // 6. 设置文本节点的内容 (用于更新 Text 类型节点)
  setText: (node: Text, text: string) => {
    node.nodeValue = text
  },

  // 7. 设置元素节点的文本内容 (用于 element.textContent)
  // 这是个优化操作，比先清空再插入 textNode 快
  setElementText: (el: Element, text: string) => {
    el.textContent = text
  },

  // 8. 获取父节点
  parentNode: (node: Node): Node | null => node.parentNode,

  // 9. 获取下一个兄弟节点 (用于遍历)
  nextSibling: (node: Node): Node | null => node.nextSibling,

  // 10. 查询元素 (用于 Teleport 或挂载根节点)
  querySelector: (selector: string): Element | null => doc.querySelector(selector),

  // 11. 设置 Scope ID (用于 scoped css)
  setScopeId(el: Element, id: string) {
    el.setAttribute(id, '')
  },

  // 克隆节点 (用于静态提升 Static Hoisting 的优化)
  cloneNode(el: Node): Node {
    return el.cloneNode(true)
  }
}