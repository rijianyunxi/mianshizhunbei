// packages/shared/src/utils/is.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
var isArray = Array.isArray;
var isString = (val) => typeof val === "string";
var onRE = /^on[^a-z]/;
var isOn = (key) => onRE.test(key);

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
  /**
   * 依赖收集的 dirtyLevel ， 用于判断是否需要触发更新
   * 初始值为 0， 每次run执行将effect._dir 加 4， 用于触发更新时，判断是否需要触发更新
   * 主要是来判断一个effect里的多个重复依赖，避免重复收集
   */
  _dirtyLevel = 4 /* DIRTY */;
  // 依赖集合， 用于存储所有依赖该属性的effect
  deps = [];
  active = true;
  onStop;
  get dirty() {
    return this._dirtyLevel === 4 /* DIRTY */;
  }
  set dirty(value) {
    this._dirtyLevel = value ? 4 /* DIRTY */ : 0 /* NO_DIRTY */;
  }
  run() {
    this._dirtyLevel = 0 /* NO_DIRTY */;
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
    effect2.deps.length = effect2._depsLength;
  }
}
function triggerEffects(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* DIRTY */) {
      effect2._dirtyLevel = 4 /* DIRTY */;
    }
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
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
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
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
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
  ["__v_isRef" /* IS_REF */] = true;
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
  if (ref2.dep) {
    triggerEffects(ref2.dep);
  }
}

// packages/reactivity/src/computed.ts
function computed(getter) {
  return new ComputedRefImpl(getter);
}
var ComputedRefImpl = class {
  _value;
  effect;
  dep;
  constructor(getter) {
    this.effect = new ReactiveEffect(getter, () => {
      triggerRefValue(this);
    });
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
};

// packages/runtime-dom/src/nodeOps.ts
var svgNS = "http://www.w3.org/2000/svg";
var doc = typeof document !== "undefined" ? document : null;
var nodeOps = {
  // 1. 插入节点
  // anchor 是锚点，如果为 null，insertBefore 等同于 appendChild
  insert: (child, parent, anchor) => {
    parent.insertBefore(child, anchor || null);
  },
  // 2. 移除节点
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  // 3. 创建元素节点
  // isSVG: 是否是 SVG 标签
  // is: 用于 Web Components 的 is 属性
  createElement: (tag, isSVG, is, props) => {
    const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : void 0);
    if (tag === "select" && props && props.multiple != null) {
      ;
      el.setAttribute("multiple", "multiple");
    }
    return el;
  },
  // 4. 创建文本节点
  createText: (text) => doc.createTextNode(text),
  // 5. 创建注释节点
  createComment: (text) => doc.createComment(text),
  // 6. 设置文本节点的内容 (用于更新 Text 类型节点)
  setText: (node, text) => {
    node.nodeValue = text;
  },
  // 7. 设置元素节点的文本内容 (用于 element.textContent)
  // 这是个优化操作，比先清空再插入 textNode 快
  setElementText: (el, text) => {
    el.textContent = text;
  },
  // 8. 获取父节点
  parentNode: (node) => node.parentNode,
  // 9. 获取下一个兄弟节点 (用于遍历)
  nextSibling: (node) => node.nextSibling,
  // 10. 查询元素 (用于 Teleport 或挂载根节点)
  querySelector: (selector) => doc.querySelector(selector),
  // 11. 设置 Scope ID (用于 scoped css)
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  // 克隆节点 (用于静态提升 Static Hoisting 的优化)
  cloneNode(el) {
    return el.cloneNode(true);
  }
};

// packages/runtime-dom/src/modules/class.ts
function patchClass(el, value, isSVG) {
  const transitionClasses = el._vtc;
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/style.ts
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);
  if (next && !isCssString) {
    for (const key in next) {
      setStyle(style, key, next[key]);
    }
    if (prev && !isString(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          setStyle(style, key, "");
        }
      }
    }
  } else {
    if (isCssString) {
      if (prev !== next) {
        style.cssText = next;
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
  }
}
function setStyle(style, name, val) {
  if (val == null) val = "";
  style[name] = val;
}

// packages/runtime-dom/src/modules/events.ts
function patchEvent(el, rawName, prevValue, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const name = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(nextValue);
      el.addEventListener(name, invoker);
    } else if (existingInvoker) {
      el.removeEventListener(name, existingInvoker);
      invokers[rawName] = void 0;
    }
  }
}
function createInvoker(initialValue) {
  const invoker = (e) => {
    const value = invoker.value;
    if (Array.isArray(value)) {
      value.forEach((fn) => fn(e));
    } else {
      value(e);
    }
  };
  invoker.value = initialValue;
  return invoker;
}
function parseName(rawName) {
  return rawName.slice(2).toLowerCase();
}

// packages/runtime-dom/src/modules/props.ts
function patchDOMProp(el, key, value) {
  if (key === "value" && el.tagName === "INPUT") {
    el.value = value == null ? "" : value;
    return;
  }
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      el[key] = false;
      return;
    }
  }
  el[key] = value;
}

// packages/runtime-dom/src/modules/attrs.ts
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/patchProp.ts
var patchProp = (el, key, prevValue, nextValue, isSVG = false) => {
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue);
  } else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    return key === "innerHTML" || key === "textContent";
  }
  if (key === "spellcheck" || key === "draggable" || key === "translate") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (key in el) {
    return true;
  }
  return false;
}

// packages/runtime-core/src/vnode.ts
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}

// packages/runtime-core/src/renderer.ts
function createRenderer(rendererOptions2) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = rendererOptions2;
  const mountchildren = (children, container) => {
    for (let item of children) {
      if (!isVNode(item)) {
        hostInsert(hostCreateText(String(item)), container, null);
      } else {
        patch(container._vnode || null, item, container);
      }
    }
  };
  const mountElement = (vnode, container) => {
    let { type, props, children, shapeFlag } = vnode;
    console.log({ type, props, children, shapeFlag });
    const el = hostCreateElement(type);
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else {
      console.log("mountchildren", { children, el });
      mountchildren(children, el);
    }
    hostInsert(el, container, null);
  };
  const patch = (n1, n2, container) => {
    if (n1 === n2) return;
    mountElement(n2, container);
  };
  const render2 = (vnode, container) => {
    patch(container._vnode || null, vnode, container);
    container._vnode = vnode;
  };
  return {
    render: render2,
    patch
  };
}

// packages/runtime-core/src/createVNode.ts
var createVNode = (type, props = null, children = null) => {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  const vnode = {
    __v_isVNode: true,
    // 内部属性，标识这是一个 VNode
    type,
    props,
    children,
    shapeFlag,
    el: null,
    // 真实 DOM，挂载后才有值
    key: props && props.key,
    // 提取 key 用于 Diff
    component: null
    // 组件实例
  };
  normalizeChildren(vnode, children);
  return vnode;
};
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (Array.isArray(children)) {
    type = 16 /* ARRAY_CHILDREN */;
  } else if (typeof children === "object") {
  } else {
    children = String(children);
    type = 8 /* TEXT_CHILDREN */;
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}

// packages/runtime-dom/src/index.ts
var rendererOptions = Object.assign({}, nodeOps, {
  patchProp
});
function render(vnode, container) {
  createRenderer(rendererOptions).render(vnode, container);
}
export {
  ReactiveEffect,
  activeEffect,
  computed,
  createRenderer,
  effect,
  h,
  isTracking,
  reactive,
  ref,
  render,
  shouldTrack,
  toReactive,
  trackEffects,
  trackRefValue,
  triggerEffects,
  triggerRefValue
};
//# sourceMappingURL=vue.js.map
