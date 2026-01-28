import { ReactiveFlags } from "../constants";

/**
 * 检查一个值是否为对象类型
 * 
 * 在JavaScript中，typeof null === 'object' 是一个历史遗留问题，
 * 因此需要额外检查值不等于null来确保正确识别对象
 * 
 * @param value - 需要检查的任意值
 * @returns 如果值是对象且不为null，则返回true，否则返回false
 * 
 * @example
 * ```typescript
 * isObject({}) // true
 * isObject([]) // true (数组也是对象)
 * isObject(null) // false
 * isObject(42) // false
 * isObject('string') // false
 * ```
 */
export function isObject(value: unknown): value is Record<any, any> {
    return typeof value === 'object' && value !== null;
}


export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}





// 2. 判断数组
export const isArray = Array.isArray



// 4. 判断字符串
export const isString = (val: unknown): val is string => 
  typeof val === 'string'

// 5. 判断 Symbol
export const isSymbol = (val: unknown): val is symbol => 
  typeof val === 'symbol'

// 6. 判断是否为 Promise (duck typing: 有 .then 和 .catch 方法)
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

// 集合类型判断 
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'
export const isDate = (val: unknown): val is Date => 
  toTypeString(val) === '[object Date]'

// 判断纯对象 
export const isPlainObject = (val: unknown): val is object => 
  toTypeString(val) === '[object Object]'



export const objectToString = Object.prototype.toString;


export const toTypeString = (value: unknown): string =>
  objectToString.call(value);



export interface Ref<T = any> {
    value: T;
    [ReactiveFlags.IS_REF]: boolean; 
}

export function isRef(r: any): r is Ref {
    // !! 是为了转成布尔值
    // r && ... 是为了防止 r 是 null 报错
    return !!(r && r[ReactiveFlags.IS_REF] === true);
}

export function isReactive(value: unknown): boolean {
    // 尝试去"读取"这个特殊的属性
    // 如果 value 是个普通对象，读取结果是 undefined -> 转成 false
    // 如果 value 是个 Proxy，读取会被 get 拦截 -> 返回 true
    return !!(value && (value as any)[ReactiveFlags.IS_REACTIVE]);
}