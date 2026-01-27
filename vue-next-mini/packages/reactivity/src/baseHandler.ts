import { reactive } from './reactive';
import { track, trigger } from './reactiveEffect';
import { isObject } from "@vue-mini/shared";
import { ReactiveFlags } from './constants';

export const baseHandler: ProxyHandler<object> = {
        get(target, key, receiver) {
            // console.log('proxy data get=====>',key, ':', value);
            if (key === ReactiveFlags.IS_REACTIVE) {
                return true;
            }
            track(target, key);
            const res = Reflect.get(target, key, receiver);
            if (isObject(res)) {
                return reactive(res);
            }
            
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