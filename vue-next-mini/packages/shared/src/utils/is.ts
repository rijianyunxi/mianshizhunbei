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