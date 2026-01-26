// packages/shared/src/utils/is.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/effect.ts
var activeEffect = void 0;
var shouldTrack = true;
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  if (options) {
    Object.assign(_effect, options);
  }
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.fn = fn;
    this.scheduler = scheduler;
  }
  // 当作指针来用，方便替换新增或者删除后续多余依赖的删除
  _depsLength = 0;
  /**
   * 依赖收集的id，作为判断当次run还是监听到set后后的重新run收集
   * 初始值为 0， 每次run执行将effect._trackId 加 1， 用于触发更新时，判断是否需要触发更新
   * 主要是来判断一个effect里的多个重复依赖，避免重复收集
   */
  _trackId = 0;
  // 依赖集合， 用于存储所有依赖该属性的effect
  deps = [];
  active = true;
  onStop;
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastActiveEffect = activeEffect;
    try {
      activeEffect = this;
      preClearnEffect(this);
      return this.fn();
    } finally {
      postCleanEffect(this);
      activeEffect = lastActiveEffect;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
    }
  }
};
function isTracking() {
  return shouldTrack && activeEffect !== void 0;
}
function trackEffects(dep) {
  if (activeEffect === void 0) {
    return;
  }
  if (dep.get(activeEffect) !== activeEffect._trackId) {
    dep.set(activeEffect, activeEffect._trackId);
    let oldDep = activeEffect.deps[activeEffect._depsLength];
    if (oldDep !== dep) {
      cleanDepEffect(activeEffect, oldDep);
      activeEffect.deps[activeEffect._depsLength++] = dep;
    } else {
      activeEffect._depsLength++;
    }
  }
}
function preClearnEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function cleanDepEffect(effect2, dep) {
  if (dep) {
    dep.delete(effect2);
    if (dep.size === 0) {
      dep.cleanup?.(dep);
    }
  }
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depsLength) {
    for (let i = effect2._depsLength; i < effect2.deps.length; i++) {
      cleanDepEffect(effect2, effect2.deps[i]);
    }
    effect2._depsLength = effect2.deps.length;
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2 !== activeEffect) {
      if (effect2.scheduler) {
        effect2.scheduler();
      } else {
        effect2.run();
      }
    } else {
      console.warn("vue3-mini  \u5FAA\u73AF\u4F9D\u8D56");
    }
  }
}

// packages/reactivity/src/reactiveEffect.ts
var targetMap = /* @__PURE__ */ new Map();
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = /* @__PURE__ */ new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      dep = createDep();
      dep.depsMap = depsMap;
      dep.key = key;
      dep.cleanup = finalizeDepCleanup;
      depsMap.set(key, dep);
    }
    trackEffects(dep);
    console.log("targetMap", targetMap);
  }
}
function finalizeDepCleanup(dep) {
  const { depsMap, key } = dep;
  if (depsMap) {
    depsMap.delete(key);
  }
  dep.depsMap = void 0;
}
function createDep(fn) {
  let dep = /* @__PURE__ */ new Map();
  dep.cleanup = fn;
  return dep;
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive") {
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
    const oldValue = Reflect.get(target, key, receiver);
    const res = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return res;
  }
};

// packages/reactivity/src/reactive.ts
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  const proxy = createReactiveObject(target);
  return proxy;
}
function toReactive(target) {
  return target ? reactive(target) : target;
}
function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  if (target.__v_isReactive) {
    return target;
  }
  const proxy = new Proxy(target, baseHandler);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  constructor(rawValue) {
    this.rawValue = rawValue;
    this._value = toReactive(rawValue);
  }
  _value;
  dep = void 0;
  __v_isRef = true;
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (this.rawValue !== newValue) {
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  if (isTracking()) {
    if (!ref2.dep) {
      ref2.dep = createDep();
    }
    trackEffects(ref2.dep);
  }
}
function triggerRefValue(ref2) {
  console.log(
    "triggerRefValue=====>",
    ref2,
    isTracking()
  );
  if (isTracking()) {
    if (ref2.dep) {
      triggerEffects(ref2.dep);
    }
  }
}
export {
  effect,
  reactive,
  ref
};
//# sourceMappingURL=vue.js.map
