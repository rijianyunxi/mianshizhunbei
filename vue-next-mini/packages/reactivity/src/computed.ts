// import { isFunction } from "@vue-mini/shared";
import { Dep, ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export function computed<T>(getter: () => T): ComputedRefImpl<T> {
    return new ComputedRefImpl(getter);
}



class ComputedRefImpl<T> {

    public _value!: T;
    public effect: ReactiveEffect;

    public dep?: Dep;
    constructor(getter: () => T) {
        this.effect = new ReactiveEffect(getter, () => {
            triggerRefValue(this);
        });
    }

    get value() {
        if(this.effect.dirty) {
            this._value = this.effect.run()!;
            trackRefValue(this);
        }
        return this._value;
    }
}