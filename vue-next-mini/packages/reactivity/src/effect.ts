

//  依赖集合类型， 继承自 Map<ReactiveEffect, ReactiveEffect> ， 并添加了 cleanup 方法
export type Dep = Map<ReactiveEffect, number> & {
    cleanup?: () => void;
}


/**
 * activeEffect 是当前正在运行的 effect 实例
 * 当 effect 运行时，会将当前 effect 实例赋值给 activeEffect
 * 当 effect 运行完成后，会将 activeEffect 恢复为 null
 */
export let activeEffect: ReactiveEffect | null = null;

/**
 * 响应式effect 函数
 * 用于创建响应式effect 实例
 * 1. 收集依赖
 * 2. 触发更新
 * 3. 停止依赖收集
 */
export function effect(fn: () => void, options: object = {}) {
    const _effect = new ReactiveEffect(fn, () => {
        _effect.run();
    });
    _effect.run();
}


/**
 * 响应式effect 类
 * 用于响应式数据的依赖收集和触发更新
 * 1. 收集依赖
 * 2. 触发更新
 * 3. 停止依赖收集
 * 4. 手动触发更新
 */

export class ReactiveEffect {
    // 当作指针来用，方便替换新增或者删除后续多余依赖的删除
    _depsLength = 0;
    /**
     * 依赖收集的id，作为判断当次run还是监听到set后后的重新run收集
     * 初始值为 0， 每次run执行将effect._trackId 加 1， 用于触发更新时，判断是否需要触发更新
     * 主要是来判断一个effect里的多个重复依赖，避免重复收集
     */
    
    _trackId = 0;
    // 依赖集合， 用于存储所有依赖该属性的effect
    deps: Dep[] = [];
    fn: () => void;
    scheduler: () => void;
    active: boolean = true;
    constructor(fn: () => void, scheduler: () => void) {
        this.fn = fn;
        this.scheduler = scheduler;
    }

    run() {
        if (!this.active) {
            return this.fn();
        }
        // 缓存当前的activeEffect ，最后恢复, 防止嵌套effect 时，内层effect 覆盖外层effect
        let lastActiveEffect = activeEffect;
        try {
            activeEffect = this;
            preClearnEffect(this);
            return this.fn();
        } finally {
            postCleanEffect(this);
            activeEffect = lastActiveEffect;
        }
    }

    stop() {
        if (this.active) {
            this.active = false;
            // this.depsMap.forEach(dep => {
            //     dep.delete(this);
            // });
        }
    }
}

/**
 * 
 * @param effect 
 * 每次run执行将effect._depsLength 重置为 0， 并将effect._trackId 加 1
 * 用于触发更新时，判断是否需要触发更新 
 */
function preClearnEffect(effect: ReactiveEffect) {
    effect._depsLength = 0;
    effect._trackId++;
}

function cleanDepEffect(effect: ReactiveEffect, dep: Dep) {
    if (dep) {
        dep.delete(effect);
        if (dep.size === 0) {
            dep.cleanup?.();
        }
    }
}

function postCleanEffect(effect: ReactiveEffect) {
    if (effect.deps.length > effect._depsLength) {
        for (let i = effect._depsLength; i < effect.deps.length; i++) {
            cleanDepEffect(effect, effect.deps[i]);
        }
        effect._depsLength = effect.deps.length;
    }
}

export function trackEffect(effect: ReactiveEffect, dep: Dep) {

    if (dep.get(effect) !== effect._trackId) {

        dep.set(effect, effect._trackId);

        let oldDep = effect.deps[effect._depsLength];

        if (oldDep !== dep) {
            cleanDepEffect(effect, oldDep);

            effect.deps[effect._depsLength++] = dep;
        } else {
            effect._depsLength++;
        }
    }

    console.log('effect', effect);

}

