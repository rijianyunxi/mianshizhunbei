import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/styles/index.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
const app = createApp(App)
app.use(router).mount('#app')
