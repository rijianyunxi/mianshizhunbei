// packages/shared/src/utils/is.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/effect.ts
var activeEffect = null;
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
var ReactiveEffect = class {
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
  fn;
  scheduler;
  active = true;
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
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
function preClearnEffect(effect2) {
  effect2._depsLength = 0;
  effect2._trackId++;
}
function cleanDepEffect(effect2, dep) {
  if (dep) {
    dep.delete(effect2);
    if (dep.size === 0) {
      dep.cleanup?.();
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
function trackEffect(effect2, dep) {
  if (dep.get(effect2) !== effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depsLength];
    if (oldDep !== dep) {
      cleanDepEffect(effect2, oldDep);
      effect2.deps[effect2._depsLength++] = dep;
    } else {
      effect2._depsLength++;
    }
  }
  console.log("effect", effect2);
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
      depsMap.set(key, dep = createDep(() => {
        depsMap.delete(key);
      }));
    }
    trackEffect(activeEffect, dep);
    console.log("targetMap", targetMap);
  }
}
function createDep(cleanup) {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  return dep;
}
function trigger(target, key, newValue, oldValue) {
  console.log("trigger=====>", target, key, newValue, oldValue);
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  for (const effect2 of dep.keys()) {
    if (effect2.scheduler) {
      effect2.scheduler();
    } else {
      effect2.run();
    }
  }
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive") {
      return true;
    }
    track(target, key);
    const res = Reflect.get(target, key, receiver);
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
export {
  effect,
  reactive
};
//# sourceMappingURL=vue.js.map
