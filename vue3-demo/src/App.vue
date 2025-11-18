<script setup lang="ts">
import { reactive,computed } from 'vue';


let a = reactive({
  count: 0
})

const c = computed(() => {
  a.count;
  console.log("computed");
  
})
</script>
 
<template>
   <h1>1111</h1>
   <h2>22x{{ c }}</h2>
</template>


