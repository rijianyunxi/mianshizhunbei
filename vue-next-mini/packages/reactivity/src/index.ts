
console.log('hello reactivity....');
export { reactive } from './reactive';

export function effect(fn: () => void) {
    fn();
}