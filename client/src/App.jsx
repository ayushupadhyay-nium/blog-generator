import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import EditorPage from './pages/EditorPage.jsx'
import Toast from './components/shared/Toast.jsx'
import useBlogStore from './store/useBlogStore.js'

function ToastWrapper() {
  const { error, clearError } = useBlogStore()
  return error ? <Toast message={error} type="error" onClose={clearError} /> : null
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/blog/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastWrapper />
    </BrowserRouter>
  )
}
