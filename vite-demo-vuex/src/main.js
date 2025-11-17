import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store'

const app = createApp(App)
app.use(store) // 注册 Vuex
app.mount('#app')