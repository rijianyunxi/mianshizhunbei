import { isObject, isFunction, isMap, isSet, isPlainObject,isReactive, isRef } from "@vue-mini/shared";
import { ReactiveEffect } from "./effect";

export interface WatchOptions {
    deep?: boolean;
    immediate?: boolean;
    flush?: 'pre' | 'post' | 'sync';
}

export function watch(source: any, cb: any, options: WatchOptions = {}) {
    doWatch(source, cb, options);
}

function doWatch(source: any, cb: any, { deep, immediate, flush }: WatchOptions) {
    let getter: () => any;

    // 1. 标准化 Source：处理 source 的不同类型 (ref, reactive, getter)
    if (isReactive(source)) {
        getter = () => source;
        deep = true; // Reactive 对象默认开启 deep
    } else if (isFunction(source)) {
        getter = () => source();
    } else {
        getter = () => {};
        console.warn('Invalid watch source');
    }

    // 2. 处理 Deep：如果是 deep 或者是 reactive 对象，需要包裹 traverse
    if (cb && deep) {
        const baseGetter = getter;
        // traverse 会递归读取属性，从而触发依赖收集
        getter = () => traverse(baseGetter());
    }

    // 3. 存储旧值
    let oldValue: any;

    // 4. 定义调度器 Job
    const job = () => {
        if (!effect.active) return;
        
        // 重新执行 getter 获取新值
        const newValue = effect.run();
        
        // 只有值变了（或者 deep 强制触发）才回调
        if (deep || hasChanged(newValue, oldValue)) {
            // 执行用户回调：cb(new, old)
            cb(newValue, oldValue);
            // 更新旧值，为下次做准备
            oldValue = newValue;
        }
    };

    // 5. 创建 Effect
    // 注意：watch 的 scheduler 是 job，而不是直接 cb
    const effect = new ReactiveEffect(getter, job);

    // 6. 初始化执行
    if (immediate) {
        job();
    } else {
        // 非 immediate，先运行一次拿到初始的 oldValue
        oldValue = effect.run();
    }
}

/**
 * 优化后的遍历函数：防止循环引用 + 通用集合支持
 */
function traverse(value: any, seen?: Set<any>) {
    if (!isObject(value)) {
        return value;
    }
    // 防止循环引用死循环
    seen = seen || new Set();
    if (seen.has(value)) {
        return value;
    }
    seen.add(value);

    // 针对不同类型遍历
    if (isRef(value)) { // 如果是 Ref，继续深挖 .value
        traverse(value.value, seen);
    } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            traverse(value[i], seen);
        }
    } else if (isSet(value) || isMap(value)) {
        value.forEach((v: any) => {
            traverse(v, seen);
        });
    } else if (isPlainObject(value)) {
        for (const key in value) {
            traverse(value[key], seen);
        }
    }
    return value;
}

// 辅助函数：简单的值比对
function hasChanged(value: any, oldValue: any): boolean {
    return !Object.is(value, oldValue);
}

