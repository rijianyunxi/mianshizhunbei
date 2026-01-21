<script lang="ts" setup>
import {ref,h,} from 'vue'
const title = ref('Home')


const renderSpan = () => {
    return h('span',{},'这是 Home 页面')
}
console.log(renderSpan());

</script>


<template>
    <div>
        <h1>{{title}}

            <span>这是 Home 页面</span>
        </h1>
    </div>
</template>


<style scoped lang="scss">
    h1 {
        color: red;
        span{
            color: blue;
        }
    }
</style>
