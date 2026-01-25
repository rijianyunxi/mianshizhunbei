import { activeEffect,ReactiveEffect,trackEffect } from "./effect";
import type { Dep } from "./effect";
/**
 * 目标对象 -> 键 -> 依赖集合
 * 每个属性对应一个依赖集合，集合中存放所有依赖该属性的effect
 * 双映射，实现目标对象 -> 键 -> 依赖集合的映射，均为Map
 */
const targetMap = new Map();

export function track(target: object, key: string|symbol) {
    if (activeEffect) {
        let depsMap = targetMap.get(target)
        if(!depsMap) {
            depsMap = new Map();
            targetMap.set(target, depsMap);
        }
        let dep = depsMap.get(key);
        if(!dep) {
            depsMap.set(key, dep = createDep(() => {
                depsMap.delete(key);
            }));
        }
        trackEffect(activeEffect, dep);

        console.log('targetMap',targetMap);
        
    }
}




function createDep(cleanup?: () => void) {
    const dep = new Map<ReactiveEffect, number>() as Dep;
    dep.cleanup = cleanup;
    return dep;
}


export function trigger(target: object, key: string|symbol,newValue?: any,oldValue?: any) {
        
    console.log('trigger=====>', target, key, newValue, oldValue);
    const depsMap = targetMap.get(target);
        if(!depsMap) {
            return;
        }
        const dep = depsMap.get(key);
        if(!dep) {
            return;
        }
        for(const effect of dep.keys()) {
            if(effect.scheduler) {
                effect.scheduler();
            } else {
                effect.run();
            }
        }

        
}