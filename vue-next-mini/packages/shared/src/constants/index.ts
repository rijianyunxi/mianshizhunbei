export enum ReactiveFlags {
    SKIP = '__v_skip',
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    IS_REF = '__v_isRef',
}

export enum DirtyLevel {
    DIRTY = 4,
    CLEAN = 1,
    NO_DIRTY = 0,
}
