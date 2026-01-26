
//  依赖集合类型， 继承自 Map<ReactiveEffect, ReactiveEffect> ， 并添加了 cleanup 方法
export type Dep = Map<ReactiveEffect, number> & {
    cleanup?: (dep: Dep) => void;
    key?: string | symbol;
    depsMap?: Map<any, any>;
};


/**
 * activeEffect 是当前正在运行的 effect 实例
 * 当 effect 运行时，会将当前 effect 实例赋值给 activeEffect
 * 当 effect 运行完成后，会将 activeEffect 恢复为 null
 */
export let activeEffect: ReactiveEffect | undefined = undefined;
/**
 * 是否需要收集依赖
 * 当 shouldTrack 为 true 时，才会收集依赖
 * 当 shouldTrack 为 false 时，不会收集依赖
 */
export let shouldTrack = true;



// 定义 Options 的接口
export interface ReactiveEffectOptions {
    scheduler?: () => void;
    onStop?: () => void;
    // 如果你要支持 lazy，也可以加在这里
    lazy?: boolean;
}

export interface ReactiveEffectRunner<T = any> {
    (): T; // 调用签名为 T (即 fn 的返回值)
    effect: ReactiveEffect; // 挂载的 effect 实例
}

/**
 * 响应式effect 函数
 * 用于创建响应式effect 实例
 * 1. 收集依赖
 * 2. 触发更新
 * 3. 停止依赖收集
 */
export function effect<T = any>(
    fn: () => T,
    options?: ReactiveEffectOptions
): ReactiveEffectRunner<T> {

    // 或者按你的代码逻辑（注意：通常 scheduler 是通过 options 传进去的，而不是写死在构造函数里）
    const _effect = new ReactiveEffect(fn, () => {
        _effect.run();
    });

    // 合并选项
    if (options) {
        Object.assign(_effect, options);
    }

    // 默认执行一次 (除非 options.lazy 为 true，这里按你的逻辑先直接执行)
    _effect.run();

    // bind 返回的是一个普通函数，我们需要断言它是 ReactiveEffectRunner
    const runner = _effect.run.bind(_effect) as ReactiveEffectRunner<T>;

    // 挂载 effect 实例
    runner.effect = _effect;

    return runner;
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
    public _depsLength: number = 0;
    /**
     * 依赖收集的id，作为判断当次run还是监听到set后后的重新run收集
     * 初始值为 0， 每次run执行将effect._trackId 加 1， 用于触发更新时，判断是否需要触发更新
     * 主要是来判断一个effect里的多个重复依赖，避免重复收集
     */
    public _trackId: number = 0;
    // 依赖集合， 用于存储所有依赖该属性的effect
    public deps: Dep[] = [];
    public active: boolean = true;
    public onStop?: () => void;
    constructor(public fn: () => void, public scheduler?: () => void) {
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


// 辅助函数：判断是否需要收集
export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}


// 收集依赖
export function trackEffects(dep: Dep) {
    // 当 activeEffect 为 undefined 时，说明当前没有运行中的 effect，无需收集依赖
    if (activeEffect === undefined) {
        return;
    }
    // 根据当前effect的_trackId 判断是否需要是否为同一次key的依赖收集，相同的话表示重复收集，无需处理
    if (dep.get(activeEffect) !== activeEffect._trackId) {
        // 不同的话表示为新的依赖收集，需要添加到依赖集合中或者替换旧的依赖的_trackId更新
        dep.set(activeEffect, activeEffect._trackId);
        // 从deps取到当前deps _depsLength位置的依赖，与新的依赖进行比较
        let oldDep = activeEffect.deps[activeEffect._depsLength];

        if (oldDep !== dep) {
            cleanDepEffect(activeEffect, oldDep);

            activeEffect.deps[activeEffect._depsLength++] = dep;
        } else {
            activeEffect._depsLength++;
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
            dep.cleanup?.(dep);
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

// 触发依赖更新
export function triggerEffects(dep: Dep) {
    // const effects = [...dep.keys()];
    // for (let i = 0; i < effects.length; i++) {
    //     const effect = effects[i];
    //     if (effect.scheduler) {
    //         effect.scheduler();
    //     } else {
    //         effect.run();
    //     }
    // }

    for (const effect of dep.keys()) {
        if (effect !== activeEffect) {
            if (effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        } else {
            console.warn('vue3-mini  循环依赖');
        }
    }
}