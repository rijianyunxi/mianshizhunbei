import { reactive } from "vue";
import { forEachValue } from '@/util'



export default class Store {
  constructor(options) {
    console.log('======== my vuex store =====');
    const { state, mutations = {}, actions = {}, getters = {} } = options;
    const store = this;
    store._state = reactive({
      data: state(),
    });
    store._getters = getters;
    store._mutations = Object.create(null);
    store._actions = Object.create(null);
    store.getters = {};

    // 处理getters
    forEachValue(getters, (fn, key) => {
      Object.defineProperty(store.getters, key, {
        get: () => fn(store._state.data),
      });
    });
    // 处理mutations
    forEachValue(mutations, (fn, key) => {
      store._mutations[key] = (payload) => fn(store._state.data, payload);
    });
    // 处理actions
    forEachValue(actions, (fn, key) => {
      store._actions[key] = (payload) => fn(store, payload);
    });
    this.commit = this.commit.bind(this);
    this.dispatch = this.dispatch.bind(this);
  }

  install(app, inJectKey = "store") {
    app.provide(inJectKey, this);
  }
  get state() {
    return this._state.data;
  }


  commit(type, payload){
    console.log(this);
    this._mutations[type](payload);
  }

  dispatch(type, payload) {
    console.log(this);
    this._actions[type](payload);
  }
}
