// packages/shared/src/utils/is.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}

// packages/reactivity/src/reactive.ts
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target.__v_isReactive) {
    return target;
  }
  const proxy = createReactiveObject(target);
  return proxy;
}
function createReactiveObject(target) {
  const proxy = new Proxy(target, {
    get(target2, key, receiver) {
      if (key === "__v_isReactive") {
        return true;
      }
      const res = Reflect.get(target2, key, receiver);
      return res;
    },
    set(target2, key, value, receiver) {
      console.log("proxy data set=====>", key, ":", value);
      const res = Reflect.set(target2, key, value, receiver);
      return res;
    }
  });
  return proxy;
}

// packages/reactivity/src/index.ts
console.log("hello reactivity....");
function effect(fn) {
  fn();
}

// packages/vue/src/index.ts
console.log("hello vue");
export {
  effect,
  reactive
};
//# sourceMappingURL=vue.js.map
