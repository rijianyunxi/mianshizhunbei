import { createStore } from '../vuex'



export const store = createStore({
  state() {
    return {
      count: 100
    }
  },
  getters: {
    doubleCount(state) {
      return state.count * 2
    }
  },
  mutations: {
    increment(state,payload) {
      if(payload) {
        state.count += payload
      } else {
        state.count++
      }
    },
  },
  actions: {
    incrementAsync({ commit },payload) {
      setTimeout(() => {
        commit('increment',payload)
      }, 1000)
    }
  }
})
