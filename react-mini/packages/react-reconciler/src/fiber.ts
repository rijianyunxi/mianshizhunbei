import type { WorkTag } from './workTags';
import type { Props, Key, Ref } from 'shared/ReactTypes';
import { NoFlags, Placement, Update, ChildDeletion, Passive } from './fiberFlags';
import type { Flags } from './fiberFlags';


export class FirberNode {
    type: any;
    tag: WorkTag;
    pendingProps: Props;
    key: Key;
    stateNode: any
    return: FirberNode | null;
    child: FirberNode | null;
    sibling: FirberNode | null;
    index: number;
    ref: Ref | null;
    memoizedProps: Props | null;
    alternate: FirberNode | null;
    flags: Flags;

    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        this.tag = tag;
        this.stateNode = null;
        this.key = key;
        this.type = null;
        // 构成结构，指向父FiberNode
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;
        this.ref = null;

        // 作为工作单元
        this.pendingProps = pendingProps;
        this.memoizedProps = null;
        this.alternate = null;
        // 作为工作单元，初始时没有任何操作，增删改查，后续会根据情况添加操作
        this.flags = NoFlags;
    }

}