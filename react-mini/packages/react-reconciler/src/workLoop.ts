import { FirberNode } from "./fiber";

let workInProgress: FirberNode | null = null;

function prepareFreshStack(fiber: FirberNode){
    workInProgress = fiber;
}

function renderRoot(root:FirberNode) {
    return null;
} 

function workLoop(){
    while(workInProgress !== null){
        performUnitOfWork(workInProgress);
    }
}


function performUnitOfWork(fiber: FirberNode){
    // 1. 处理当前FiberNode
    // 2. 处理子FiberNode
    // 3. 处理兄弟FiberNode
}
