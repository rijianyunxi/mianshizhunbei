<script setup>
import { useStore } from './vuex'
import { computed } from 'vue'

const store = useStore();
const count = computed(() => store.state.count)
const doubleCount = computed(() => store.getters.doubleCount)
function increment() {
  let commit = store.commit
  commit('increment',10)
  // store.commit('increment',10)
}

// 调用 action
function incrementAsync() {
  store.dispatch('incrementAsync',100)
}
</script>

<template>
  <div>
    <h1>Store</h1>
    <p>Count: {{ count }}</p>
    <p>Count: {{ $store }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">加</button>
    <button @click="incrementAsync">异步加</button>
    <hr>
  </div>
</template>
