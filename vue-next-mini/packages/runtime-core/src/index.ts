
import type { VNode } from "./vnode";


export function createRenderer(rendererOptions: RendererOptions) {
    console.log(rendererOptions)
    // const {
    //     createElement,
    //     patchProp,
    //     insert,
    //     remove,
    //     setElementText
    // } = rendererOptions;

    const patch = (n1:VNode,n2:VNode,container:Element)=>{

    }

    const render = (vnode:VNode, container:Element)=>{
     
    }

    return {
       render,
       patch
    }

}

export type { VNode } from "./vnode";


export interface NodeOps {
  insert: (child: Node, parent: Node, anchor: Node | null) => void
  remove: (child: Node) => void
  createElement: (
    tag: string,
    isSVG?: boolean,
    is?: string,
    props?: Record<string, any>
  ) => Element
  createText: (text: string) => Text
  createComment: (text: string) => Comment
  setText: (node: Text, text: string) => void
  setElementText: (el: Element, text: string) => void
  parentNode: (node: Node) => Node | null
  nextSibling: (node: Node) => Node | null
  querySelector: (selector: string) => Element | null
  setScopeId: (el: Element, id: string) => void,
  cloneNode: (node: Node) => Node,
}



export interface RendererOptions extends NodeOps {
    patchProp: (el: Element, key: string, prevValue: any, nextValue: any) => void
}
