import { track, trigger } from './reactiveEffect';

export const baseHandler: ProxyHandler<object> = {
        get(target, key, receiver) {
            // console.log('proxy data get=====>',key, ':', value);
            if (key === '__v_isReactive') {
                return true;
            }
            track(target, key);
            const res = Reflect.get(target, key, receiver);
            return res;
        },
        set(target, key, value, receiver) {
            // console.log('proxy data set=====>',key, ':', value);
            const oldValue = Reflect.get(target, key, receiver);
            const res = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
                trigger(target, key,value,oldValue);
            }
            return res;
        }
    }