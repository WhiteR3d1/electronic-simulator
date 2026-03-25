import { useRef, useCallback } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import './ComponentNode.css'

function ComponentNode({ comp }) {
  const { moveComponent, selectComponent, selectedId } = useCircuitStore()
  const def = COMPONENT_DEFS[comp.type]
  const isSelected = selectedId === comp.id
  const dragStart = useRef(null)

  // เริ่ม drag บน canvas
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation()
    selectComponent(comp.id)

    const startX = e.clientX - comp.x
    const startY = e.clientY - comp.y
    dragStart.current = { startX, startY }

    const onMouseMove = (e) => {
      const rawX = e.clientX - dragStart.current.startX
      const rawY = e.clientY - dragStart.current.startY
      // snap to grid 20px
      const x = Math.round(rawX / 20) * 20
      const y = Math.round(rawY / 20) * 20
      moveComponent(comp.id, Math.max(0, x), Math.max(0, y))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      dragStart.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [comp, moveComponent, selectComponent])

  return (
    <div
      className={`comp-node ${isSelected ? 'selected' : ''}`}
      style={{
        left: comp.x,
        top: comp.y,
        width: def.width,
        '--accent': def.color,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pin ซ้าย */}
      {def.pins[0] && (
        <div
          className="pin pin-left"
          style={{ top: def.pins[0].y - 4 }}
        />
      )}

      {/* ตัว component */}
      <div
        className="comp-body"
        style={{ height: def.height }}
      >
        <span className="node-icon">{def.icon}</span>
        <div className="node-labels">
          <span className="node-name">{def.label}</span>
          <span className="node-value">{def.value}</span>
        </div>
      </div>

      {/* Pin ขวา (ถ้ามี) */}
      {def.pins[1] && (
        <div
          className="pin pin-right"
          style={{ top: def.pins[1].y - 4 }}
        />
      )}
    </div>
  )
}

export default ComponentNode
