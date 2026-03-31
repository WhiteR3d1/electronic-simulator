import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import CanvasPage from './pages/CanvasPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/canvas" element={<CanvasPage />} />
      <Route path="/canvas/:circuitId" element={<CanvasPage />} />
    </Routes>
  )
}

export default App