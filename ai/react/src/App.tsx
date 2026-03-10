import './App.css'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'

const BundleTestPage = lazy(() => import('./pages/BundleTestPage'))

function App() {
  return (
    <Suspense fallback={<div className="route-loading">Loading...</div>}>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/bundle-test" element={<BundleTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
