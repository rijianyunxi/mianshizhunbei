import { activeEffect, ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import type { Dep } from "./effect";
/**
 * 目标对象 -> 键 -> 依赖集合
 * 每个属性对应一个依赖集合，集合中存放所有依赖该属性的effect
 * 双映射，实现目标对象 -> 键 -> 依赖集合的映射，均为Map
 */
const targetMap = new Map();

export function track(target: object, key: string | symbol) {
    if (activeEffect) {
        let depsMap = targetMap.get(target)
        if (!depsMap) {
            depsMap = new Map();
            targetMap.set(target, depsMap);
        }
        let dep: Dep = depsMap.get(key);
        if (!dep) {
            // 创建 dep
            // dep = createDep(() => {
            //     depsMap.delete(key);
            // }) as Dep;
            dep = createDep() as Dep;
            // // === 核心优化 === 
            // 不传闭包，而是把必要的上下文挂载到 dep 对象上
            dep.depsMap = depsMap;
            dep.key = key;
            dep.cleanup = finalizeDepCleanup; // 所有 dep 共用同一个函数引用！
            depsMap.set(key, dep);
        }
        trackEffects(dep);

        console.log('targetMap', targetMap);

    }
}


// 定义一个通用的清理函数 (只创建一次，全局复用)
// 这是一个没有闭包的纯函数，它只操作传入参数
function finalizeDepCleanup(dep: Dep) {
    const { depsMap, key } = dep; // 从 dep 身上取数据
    if (depsMap) {
        depsMap.delete(key);
    }
    dep.depsMap = undefined; // 解除引用
}

export function createDep(fn?: () => void) {
    let dep = new Map<ReactiveEffect, number>() as Dep;
    dep.cleanup = fn;
    return dep;
}


export function trigger(target: object, key: string | symbol, newValue?: any, oldValue?: any) {

    // console.log('trigger=====>', target, key, newValue, oldValue);
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep:Dep = depsMap.get(key);
    if (!dep) {
        return;
    }
    triggerEffects(dep);
    




}