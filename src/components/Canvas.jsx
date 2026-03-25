import { useRef, useCallback } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import ComponentNode from './ComponentNode'
import './Canvas.css'

function Canvas() {
  const canvasRef = useRef(null)
  const { components, addComponent, selectComponent } = useCircuitStore()

  // เมื่อลาก component มาวางบน canvas
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('componentType')
    if (!type) return

    const rect = canvasRef.current.getBoundingClientRect()
    const def = COMPONENT_DEFS[type]

    // คำนวณตำแหน่งที่วาง โดย snap ไปหา grid 20px
    const rawX = e.clientX - rect.left - def.width / 2
    const rawY = e.clientY - rect.top - def.height / 2
    const x = Math.round(rawX / 20) * 20
    const y = Math.round(rawY / 20) * 20

    addComponent(type, Math.max(0, x), Math.max(0, y))
  }, [addComponent])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // คลิกพื้นที่ว่าง → deselect
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      selectComponent(null)
    }
  }

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      <svg className="canvas-grid" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e1e2e" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* วาด component แต่ละตัว */}
      {components.map((comp) => (
        <ComponentNode key={comp.id} comp={comp} />
      ))}

      {/* แสดงคำแนะนำถ้ายังไม่มี component */}
      {components.length === 0 && (
        <div className="empty-hint">
          <span className="hint-icon">⬅</span>
          <p>Drag components from the sidebar</p>
          <p className="hint-sub">onto this canvas to get started</p>
        </div>
      )}
    </div>
  )
}

export default Canvas
