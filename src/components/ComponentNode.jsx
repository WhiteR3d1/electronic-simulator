import { useRef, useCallback } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import './ComponentNode.css'

// map ชื่อสี LED → hex
const LED_COLOR_MAP = {
  Red:    '#ff4d6d',
  Green:  '#34d399',
  Blue:   '#60a5fa',
  Yellow: '#fbbf24',
}

function ComponentNode({ comp }) {
  const { moveComponent, selectComponent, selectedId, clickPin, pendingPin, simRunning, simResults } = useCircuitStore()
  const def = COMPONENT_DEFS[comp.type]
  const isSelected = selectedId === comp.id

  const simData = simResults?.results?.[comp.id]
  const isActive = simRunning && simData?.active
  const isLedOn  = simRunning && simData?.ledOn

  // สีของ LED ดึงจาก props ที่ผู้ใช้เลือก
  const ledHex = comp.type === 'led'
    ? (LED_COLOR_MAP[comp.props?.color] ?? '#ff4d6d')
    : null

  // accent color: LED ใช้สีที่เลือก, อื่นๆ ใช้ def.color
  const accentColor = ledHex ?? def.color

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('pin')) return
    e.stopPropagation()
    selectComponent(comp.id)

    const startX = e.clientX - comp.x
    const startY = e.clientY - comp.y

    const onMouseMove = (e) => {
      const x = Math.round((e.clientX - startX) / 20) * 20
      const y = Math.round((e.clientY - startY) / 20) * 20
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

  const isPinPending = (pinIndex) =>
    pendingPin?.compId === comp.id && pendingPin?.pinIndex === pinIndex

  return (
    <div
      className={[
        'comp-node',
        isSelected  ? 'selected'  : '',
        pendingPin  ? 'wiring-mode' : '',
        isActive    ? 'active'    : '',
        isLedOn     ? 'led-on'    : '',
      ].join(' ')}
      style={{
        left: comp.x,
        top:  comp.y,
        width: def.width,
        '--accent':   accentColor,
        '--led-color': ledHex ?? 'transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Pins */}
      {def.pins.map((pin, i) => (
        <div
          key={i}
          className={`pin ${isPinPending(i) ? 'pin-active' : ''} ${isActive ? 'pin-live' : ''}`}
          style={{
            left:  pin.x === 0        ? -5        : undefined,
            right: pin.x === def.width ? -5        : undefined,
            top:   pin.y > 0          ? pin.y - 5 : -5,
            ...(pin.x > 0 && pin.x < def.width ? { left: pin.x - 5, right: 'unset' } : {}),
          }}
          onClick={(e) => handlePinClick(e, i)}
        />
      ))}

      {/* LED glow — ใช้สีจาก props */}
      {isLedOn && <div className="led-glow" />}

      {/* Body */}
      <div className="comp-body" style={{ height: def.height }}>
        <span className="node-icon">{def.icon}</span>
        <div className="node-labels">
          <span className="node-name">{def.label}</span>
          {simRunning && simData ? (
            <span className="node-sim-value">
              {simData.voltage}V · {simData.current}mA
            </span>
          ) : (
            <span className="node-value">
              {comp.type === 'led'
                ? (comp.props?.color ?? 'Red')
                : def.value ?? ''}
            </span>
          )}
        </div>

        {/* LED indicator dot — สีตาม props */}
        {comp.type === 'led' && (
          <div className={`led-dot ${isLedOn ? 'on' : ''}`} />
        )}
      </div>
    </div>
  )
}

export default ComponentNode