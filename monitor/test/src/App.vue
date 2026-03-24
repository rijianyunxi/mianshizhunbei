<script setup lang="ts">
import './test'
import { onMounted, ref, type Ref } from 'vue'

const count: Ref<number> = ref(0);
const changeCode = (e:PointerEvent) => {
  if(e){
    throw new Error("nnnnn")
  }
  count.value = 9088
}


onMounted(()=>{
 throw new Error('11111111')
  
})
</script>

<template>
  <h1>TEST</h1>
  <p @click="changeCode($event)">count:{{ count }}</p>
</template>

<style scoped></style>
