import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import { createContext } from 'react'



export const UserContext = createContext({
  name: '',
  age: 0,
  sex: 1,
})


function App() {


  return (
    // context
    <UserContext.Provider value={{
      name: ' 宋金涛',
      age: 18,
      sex: 1,
    }}>
      <RouterProvider router={router} />
    </UserContext.Provider>
  )
}

export default App
