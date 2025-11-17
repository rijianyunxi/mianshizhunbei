import { useState } from 'react'
import Child from './views/child/Child'
import type { MouseEvent } from 'react'

function App() {
  const [count, setCount] = useState(0)
  const testClick = (e: MouseEvent<HTMLParagraphElement>) => {
    console.log('testClick',e)
 
  }
  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>

        <p onClick={(e)=>testClick(e)}>testClick</p>
      </div>
      <Child count={count} setCount={setCount}></Child>
    </>
  )
}

export default App
