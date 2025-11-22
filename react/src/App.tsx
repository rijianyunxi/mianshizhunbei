import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import store from './store'
import http from '@/util/http'
import { useEffect } from 'react'



function App() {

  useEffect(()=>{
    http({
      url:'/user/login',
      data:{
        a:1,
        b:2
      },
      contentType:'json'
    }).then(res=>{
      console.log(res);
    })
  },[])
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
}

export default App
