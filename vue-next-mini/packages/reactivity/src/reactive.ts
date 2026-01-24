import { isObject } from "@vue-mini/shared";


export function reactive<T extends object>(target: T): T {
    if (!isObject(target)) {
        return target;
    }
    if ((target as any).__v_isReactive) {
        return target;
    }
    const proxy = createReactiveObject(target);
    return proxy as T;
}


function createReactiveObject(target: object) {
    const proxy = new Proxy(target, {
        get(target, key, receiver) {
            if (key === '__v_isReactive') {
                return true;
            }
            const res = Reflect.get(target, key, receiver);
            return res;
        },
        set(target, key, value, receiver) {
            console.log('proxy data set=====>',key, ':', value);
            
            const res = Reflect.set(target, key, value, receiver);
            return res;
        }
    })
    return proxy;
}