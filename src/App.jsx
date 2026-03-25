import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">⚡ Circuit Sim</span>
        <span className="subtitle">Electronic Simulator</span>
      </header>
      <div className="workspace">
        <Sidebar />
        <Canvas />
      </div>
    </div>
  )
}

export default App
