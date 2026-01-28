import { isObject } from "@vue-mini/shared";
import { baseHandler } from "./baseHandler";
import { ReactiveFlags } from "@vue-mini/shared";
const reactiveMap = new WeakMap<object, object>();

export function reactive<T extends object>(target: T): T {
    const proxy = createReactiveObject(target);
    return proxy as T;
}

export function toReactive<T>(target: T): T {
    return target ? reactive(target as any) as any : target;
}


function createReactiveObject(target: object) {
    if (!isObject(target)) {
        return target;
    }
    if (reactiveMap.has(target)) {
        return reactiveMap.get(target)!;
    }
    if ((target as any)[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }
    const proxy = new Proxy(target, baseHandler);
    reactiveMap.set(target, proxy);
    return proxy;
}