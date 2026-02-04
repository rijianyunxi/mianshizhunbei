

import {nodeOps} from './nodeOps'
import {patchProp} from './patchProp'
import {createRenderer} from '@vue-mini/runtime-core'
import type { VNode,RendererOptions } from "@vue-mini/runtime-core";


const rendererOptions: RendererOptions = Object.assign({}, nodeOps, {
    patchProp
})



export function render(vnode:VNode, container:Element) {
    createRenderer(rendererOptions).render(vnode, container)
}


export * from '@vue-mini/runtime-core'