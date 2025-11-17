import Store from './store'
import { inject } from "vue";


function createStore(options) {
  return new Store(options);
}

function useStore(inJectKey = "store") {
  return inject(inJectKey);
}


export { createStore, useStore }
