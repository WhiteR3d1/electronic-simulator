import { useRef, useCallback, useEffect, useState } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import ComponentNode from './ComponentNode'
import './Canvas.css'

function Canvas() {
  const canvasRef = useRef(null)
  const { components, wires, addComponent, selectComponent, cancelWire,
          pendingPin, deleteWire, simRunning, simResults, runSim, stopSim } = useCircuitStore()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelWire() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelWire])

  const handleMouseMove = useCallback((e) => {
    if (!pendingPin) return
    const rect = canvasRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [pendingPin])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('componentType')
    if (!type) return
    const rect = canvasRef.current.getBoundingClientRect()
    const def = COMPONENT_DEFS[type]
    const x = Math.round((e.clientX - rect.left - def.width / 2) / 20) * 20
    const y = Math.round((e.clientY - rect.top - def.height / 2) / 20) * 20
    addComponent(type, Math.max(0, x), Math.max(0, y))
  }, [addComponent])

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }

  const handleCanvasClick = (e) => {
    const tag = e.target.tagName
    if (e.target === canvasRef.current || tag === 'svg' || tag === 'rect' || tag === 'line') {
      selectComponent(null)
      cancelWire()
    }
  }

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
    >
      <svg className="canvas-svg" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a26" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect className="canvas-grid-svg" width="100%" height="100%" fill="url(#grid)" />

        {/* Wires */}
        {wires.map((w) => {
          const isLive = simRunning  // สายที่มีกระแสไหล
          return (
            <g key={w.id}>
              {/* click area */}
              <line
                x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                stroke="transparent" strokeWidth="12"
                style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); if (!simRunning) deleteWire(w.id) }}
              />
              {/* สายหลัก */}
              <line
                x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
                stroke={isLive ? '#4a9eff' : '#3a3a55'}
                strokeWidth={isLive ? 2.5 : 1.5}
                strokeLinecap="round"
                strokeDasharray={isLive ? '8 5' : undefined}
                className={isLive ? 'wire-animated' : ''}
                style={{ pointerEvents: 'none' }}
              />
              {/* dots ที่ปลายสาย */}
              <circle cx={w.x1} cy={w.y1} r="3"
                fill={isLive ? '#4a9eff' : '#3a3a55'}
                style={{ pointerEvents: 'none' }} />
              <circle cx={w.x2} cy={w.y2} r="3"
                fill={isLive ? '#4a9eff' : '#3a3a55'}
                style={{ pointerEvents: 'none' }} />
            </g>
          )
        })}

        {/* Preview wire */}
        {pendingPin && (
          <line
            x1={pendingPin.x} y1={pendingPin.y}
            x2={mousePos.x} y2={mousePos.y}
            stroke="#4a9eff" strokeWidth="1.5"
            strokeDasharray="6 4" strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Components */}
      {components.map((comp) => (
        <ComponentNode key={comp.id} comp={comp} />
      ))}

      {components.length === 0 && (
        <div className="empty-hint">
          <span className="hint-icon">⬅</span>
          <p>Drag components from the sidebar</p>
          <p className="hint-sub">onto this canvas to get started</p>
        </div>
      )}

      {/* ปุ่ม Run / Stop */}
      <div className="sim-toolbar">
        {!simRunning ? (
          <button className="sim-btn run" onClick={runSim}>
            ▶ Run Simulation
          </button>
        ) : (
          <button className="sim-btn stop" onClick={stopSim}>
            ⏹ Stop
          </button>
        )}
      </div>

      {/* Error message */}
      {simResults && !simResults.success && (
        <div className="sim-error">
          ⚠ {simResults.error}
        </div>
      )}

      {/* Status: กำลังต่อสาย */}
      {pendingPin && (
        <div className="wire-status">
          🔌 Click another pin to connect &nbsp;·&nbsp; <kbd>Esc</kbd> to cancel
        </div>
      )}
    </div>
  )
}

export default Canvas