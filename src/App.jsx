import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import CanvasPage from './pages/CanvasPage'
import NotFound from './pages/NotFound'
// import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/canvas" element={<CanvasPage />} />
      <Route path="/canvas/:circuitId" element={<CanvasPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App