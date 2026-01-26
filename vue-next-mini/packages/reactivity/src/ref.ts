import { log } from "node:console";
import { trackEffects,isTracking, triggerEffects } from "./effect";
import type { Dep } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";



export function ref<T>(value: T): RefImpl<T>{
    return createRef(value);
}


function createRef<T>(value: T): RefImpl<T>{
    return new RefImpl(value);
}



class RefImpl<T>{
    public _value: T;
    public dep?:Dep  = undefined;
    public readonly __v_isRef = true;
    constructor(public rawValue: T) {
        this._value = toReactive(rawValue);

    }

    get value() {
        trackRefValue(this);

        return this._value;
    }

    set value(newValue: T) {
       if(this.rawValue !== newValue){
           this.rawValue = newValue;
           this._value = toReactive(newValue);
           triggerRefValue(this);
       }
    }
}

function trackRefValue(ref: RefImpl<any>) {
    if (isTracking()) {
        if(!ref.dep){
             ref.dep = createDep();
        }
        trackEffects(ref.dep);
    }
}


function triggerRefValue(ref: RefImpl<any>) {

    console.log(
        'triggerRefValue=====>',ref,isTracking()
    );
    
  if (isTracking()) {
        if(ref.dep){
            triggerEffects(ref.dep);
        }
    }
}