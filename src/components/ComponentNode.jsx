import { useRef, useCallback } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import './ComponentNode.css'

function ComponentNode({ comp }) {
  const { moveComponent, selectComponent, selectedId, clickPin, pendingPin } = useCircuitStore()
  const def = COMPONENT_DEFS[comp.type]
  const isSelected = selectedId === comp.id
  const dragStart = useRef(null)
  const hasDragged = useRef(false)

  const handleMouseDown = useCallback((e) => {
    // ถ้าคลิกที่ pin ให้ pin จัดการเอง
    if (e.target.classList.contains('pin')) return
    e.stopPropagation()

    hasDragged.current = false
    selectComponent(comp.id)

    const startX = e.clientX - comp.x
    const startY = e.clientY - comp.y

    const onMouseMove = (e) => {
      hasDragged.current = true
      const rawX = e.clientX - startX
      const rawY = e.clientY - startY
      const x = Math.round(rawX / 20) * 20
      const y = Math.round(rawY / 20) * 20
      moveComponent(comp.id, Math.max(0, x), Math.max(0, y))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [comp, moveComponent, selectComponent])

  const handlePinClick = useCallback((e, pinIndex) => {
    e.stopPropagation()
    clickPin(comp.id, pinIndex)
  }, [comp.id, clickPin])

  // pin กำลัง pending (pin แรกที่คลิก)
  const isPinPending = (pinIndex) =>
    pendingPin && pendingPin.compId === comp.id && pendingPin.pinIndex === pinIndex

  return (
    <div
      className={`comp-node ${isSelected ? 'selected' : ''} ${pendingPin ? 'wiring-mode' : ''}`}
      style={{
        left: comp.x,
        top: comp.y,
        width: def.width,
        '--accent': def.color,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pins */}
      {def.pins.map((pin, i) => (
        <div
          key={i}
          className={`pin ${i === 0 ? 'pin-left' : 'pin-right'} ${isPinPending(i) ? 'pin-active' : ''}`}
          style={{
            left: pin.x === 0 ? -5 : undefined,
            right: pin.x === def.width ? -5 : undefined,
            top: pin.y - 5,
            // pin บน (ground)
            ...(pin.y === 0 ? { top: -5, left: def.width / 2 - 5 } : {}),
          }}
          onClick={(e) => handlePinClick(e, i)}
        />
      ))}

      {/* Body */}
      <div className="comp-body" style={{ height: def.height }}>
        <span className="node-icon">{def.icon}</span>
        <div className="node-labels">
          <span className="node-name">{def.label}</span>
          <span className="node-value">{def.value}</span>
        </div>
      </div>
    </div>
  )
}

export default ComponentNode