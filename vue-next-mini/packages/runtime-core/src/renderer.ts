
import { ShapeFlags } from "@vue-mini/shared";
import { isVNode, type VNode } from "./vnode";
export type RenderElement = Element & {_vnode:VNode}

export function createRenderer(rendererOptions: RendererOptions) {
    const {
        insert:hostInsert,
        remove:hostRemove,
        createElement:hostCreateElement,
        createText:hostCreateText,
        setText:hostSetText,
        setElementText:hostSetElementText,
        parentNode:hostParentNode,
        nextSibling:hostNextSibling,
        patchProp:hostPatchProp,
    } = rendererOptions;


    const mountchildren = (children:any,container:any)=>{
        for(let item of children){
          if(!isVNode(item)){
            hostInsert(hostCreateText(String(item)), container,null);
          }else{
          patch(container._vnode || null,item as VNode,container)
          }
        }
    }

    const mountElement = (vnode:VNode,container:RenderElement)=>{
      let {type,props,children,shapeFlag} = vnode;
      console.log( {type,props,children,shapeFlag} )
      const el = hostCreateElement(type);
      if(props){
        for(let key in props){
          hostPatchProp(el,key,null,props[key])
        }
      }
      if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
        hostSetElementText(el,children)
      }else{
        console.log('mountchildren',{children,el})
        mountchildren(children,el)
      }
      hostInsert(el,container,null)
    }
    const patch = (n1:VNode|null,n2:VNode,container:RenderElement)=>{
      if(n1  === n2) return;
      mountElement(n2,container)
      
    }

    const render = (vnode:VNode, container:RenderElement)=>{
        patch(container._vnode||null,vnode,container)
        container._vnode = vnode;
    }

    return {
       render,
       patch
    }

}



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
