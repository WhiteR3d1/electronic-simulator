import { useRef, useCallback, useEffect, useState } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import ComponentNode from './ComponentNode'
import './Canvas.css'

function Canvas() {
  const canvasRef = useRef(null)
  const {
    components, wires,
    addComponent, selectComponent, cancelWire,
    pendingPin, deleteWire, deleteSelected,
    simRunning, simResults, runSim, stopSim,
    selectedId,
  } = useCircuitStore()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // ── Keyboard shortcuts ──────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        cancelWire()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelWire, deleteSelected, selectedId])

  // ── Mouse move สำหรับ preview wire ─────────────────
  const handleMouseMove = useCallback((e) => {
    if (!pendingPin) return
    const rect = canvasRef.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [pendingPin])

  // ── Drop component จาก sidebar ─────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('componentType')
    if (!type) return
    const rect = canvasRef.current.getBoundingClientRect()
    const def  = COMPONENT_DEFS[type]
    const x = Math.round((e.clientX - rect.left - def.width  / 2) / 20) * 20
    const y = Math.round((e.clientY - rect.top  - def.height / 2) / 20) * 20
    addComponent(type, Math.max(0, x), Math.max(0, y))
  }, [addComponent])

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }

  // 🛠️ FIX: เช็คเฉพาะ canvasRef.current เท่านั้น
  // ไม่เช็ค tag === 'svg' / 'rect' / 'line' เพราะจะทำให้ deselect ทันทีที่คลิก component
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
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
      tabIndex={0}
    >
      {/* SVG layer: grid (pointer-events none เพื่อไม่บัง component) */}
      <svg
        className="canvas-svg"
        width="100%" height="100%"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a26" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Components — อยู่บน grid แต่ใต้ wire layer */}
      {components.map((comp) => (
        <ComponentNode key={comp.id} comp={comp} />
      ))}

      {/* SVG layer: wires (pointer-events เฉพาะ wire เท่านั้น) */}
      <svg
        className="canvas-svg"
        width="100%" height="100%"
        style={{ pointerEvents: 'none' }}
      >
        {wires.map((w) => (
          <g key={w.id} style={{ pointerEvents: 'all' }}>
            {/* click target ใหญ่ๆ สำหรับลบสาย */}
            <line
              x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
              stroke="transparent" strokeWidth="14"
              style={{ cursor: simRunning ? 'default' : 'pointer' }}
              onClick={(e) => { e.stopPropagation(); if (!simRunning) deleteWire(w.id) }}
            />
            {/* สายจริง */}
            <line
              x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
              stroke={simRunning ? '#4a9eff' : '#3a3a55'}
              strokeWidth={simRunning ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeDasharray={simRunning ? '8 5' : undefined}
              className={simRunning ? 'wire-animated' : ''}
              style={{ pointerEvents: 'none' }}
            />
            <circle cx={w.x1} cy={w.y1} r="3" fill={simRunning ? '#4a9eff' : '#3a3a55'} style={{ pointerEvents: 'none' }}/>
            <circle cx={w.x2} cy={w.y2} r="3" fill={simRunning ? '#4a9eff' : '#3a3a55'} style={{ pointerEvents: 'none' }}/>
          </g>
        ))}

        {/* Preview wire */}
        {pendingPin && (
          <line
            x1={pendingPin.x} y1={pendingPin.y}
            x2={mousePos.x}   y2={mousePos.y}
            stroke="#4a9eff" strokeWidth="1.5"
            strokeDasharray="6 4" strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Empty hint */}
      {components.length === 0 && (
        <div className="empty-hint">
          <span className="hint-icon">⬅</span>
          <p>Drag components from the sidebar</p>
          <p className="hint-sub">onto this canvas to get started</p>
        </div>
      )}

      {/* Run / Stop button */}
      <div className="sim-toolbar">
        {!simRunning ? (
          <button className="sim-btn run" onClick={runSim}>▶ Run Simulation</button>
        ) : (
          <button className="sim-btn stop" onClick={stopSim}>⏹ Stop</button>
        )}
      </div>

      {/* Error */}
      {simResults && !simResults.success && (
        <div className="sim-error">⚠ {simResults.error}</div>
      )}

      {/* Wire mode hint */}
      {pendingPin && (
        <div className="wire-status">
          🔌 Click another pin to connect &nbsp;·&nbsp; <kbd>Esc</kbd> to cancel
        </div>
      )}

      {/* Delete hint เมื่อเลือก component */}
      {selectedId && !pendingPin && (
        <div className="delete-hint">
          <kbd>Delete</kbd> to remove selected component
        </div>
      )}
    </div>
  )
}

export default Canvas