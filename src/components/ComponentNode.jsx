import { useCallback } from 'react'
import useCircuitStore, { COMPONENT_DEFS } from '../store/circuitStore'
import './ComponentNode.css'

const LED_COLOR_MAP = {
  Red: '#ff4d6d', Green: '#34d399', Blue: '#60a5fa', Yellow: '#fbbf24',
}

// ── SVG shapes สำหรับแต่ละ component ────────────────
function ComponentShape({ type, props, isActive, isLedOn, ledColor, width, height }) {
  const w = width
  const h = height
  const cx = w / 2
  const cy = h / 2

  switch (type) {

    case 'battery': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* body */}
        <rect x="4" y="8" width={w-8} height={h-16} rx="4"
          fill="#1a2a3a" stroke="#4a9eff" strokeWidth="1.5"/>
        {/* ขีดลบ */}
        <line x1="12" y1={cy} x2="28" y2={cy} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
        {/* ขีดบวก */}
        <line x1={w-28} y1={cy} x2={w-12} y2={cy} stroke="#4a9eff" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1={w-20} y1={cy-6} x2={w-20} y2={cy+6} stroke="#4a9eff" strokeWidth="2.5" strokeLinecap="round"/>
        {/* label */}
        <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
          fill="#4a9eff" fontSize="10" fontWeight="700">{props?.voltage ?? 9}V</text>
      </svg>
    )

    case 'resistor': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* lead ซ้าย */}
        <line x1="0" y1={cy} x2="14" y2={cy} stroke="#888" strokeWidth="1.5"/>
        {/* body */}
        <rect x="14" y="8" width={w-28} height={h-16} rx="3"
          fill="#c8a96e" stroke="#a07840" strokeWidth="1"/>
        {/* แถบสี ต้านทาน */}
        <rect x="20" y="8" width="4" height={h-16} fill="#8B0000" opacity="0.9"/>
        <rect x="27" y="8" width="4" height={h-16} fill="#8B0000" opacity="0.9"/>
        <rect x="34" y="8" width="4" height={h-16} fill="#ff6600" opacity="0.9"/>
        <rect x={w-26} y="8" width="5" height={h-16} fill="#c8a96e" opacity="0.6"/>
        {/* lead ขวา */}
        <line x1={w-14} y1={cy} x2={w} y2={cy} stroke="#888" strokeWidth="1.5"/>
      </svg>
    )

    case 'led': {
      const lc = ledColor ?? '#ff4d6d'
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {/* leads */}
          <line x1="0" y1={cy} x2="12" y2={cy} stroke="#888" strokeWidth="1.5"/>
          <line x1={w-12} y1={cy} x2={w} y2={cy} stroke="#888" strokeWidth="1.5"/>
          {/* glow */}
          {isLedOn && <ellipse cx={cx} cy={cy} rx="22" ry="22" fill={lc} opacity="0.2">
            <animate attributeName="opacity" values="0.15;0.35;0.15" dur="1s" repeatCount="indefinite"/>
          </ellipse>}
          {/* body */}
          <ellipse cx={cx} cy={cy} rx="14" ry="16"
            fill={isLedOn ? lc : '#1c1c28'}
            stroke={lc} strokeWidth="1.5"/>
          {/* flat side (cathode) */}
          <line x1={cx+10} y1={cy-14} x2={cx+10} y2={cy+14} stroke={lc} strokeWidth="2"/>
          {/* shine */}
          {isLedOn && <ellipse cx={cx-4} cy={cy-5} rx="4" ry="5" fill="#ffffff" opacity="0.3"/>}
        </svg>
      )
    }

    case 'switch': {
      const closed = props?.closed ?? false
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <line x1="0" y1={cy} x2="16" y2={cy} stroke="#34d399" strokeWidth="2"/>
          <line x1={w-16} y1={cy} x2={w} y2={cy} stroke="#34d399" strokeWidth="2"/>
          <circle cx="16" cy={cy} r="3" fill="#34d399"/>
          <circle cx={w-16} cy={cy} r="3" fill="#34d399"/>
          {/* lever */}
          <line
            x1="16" y1={cy}
            x2={w-16} y2={closed ? cy : cy - 14}
            stroke="#34d399" strokeWidth="2" strokeLinecap="round"/>
          <text x={cx} y={h-2} textAnchor="middle" fill="#34d399" fontSize="8">
            {closed ? 'ON' : 'OFF'}
          </text>
        </svg>
      )
    }

    case 'capacitor': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={cy} x2={cx-8} y2={cy} stroke="#888" strokeWidth="1.5"/>
        <line x1={cx-8} y1="6" x2={cx-8} y2={h-6} stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <line x1={cx+8} y1="6" x2={cx+8} y2={h-6} stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
        <line x1={cx+8} y1={cy} x2={w} y2={cy} stroke="#888" strokeWidth="1.5"/>
      </svg>
    )

    case 'diode': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={cy} x2="16" y2={cy} stroke="#888" strokeWidth="1.5"/>
        <line x1={w-16} y1={cy} x2={w} y2={cy} stroke="#888" strokeWidth="1.5"/>
        {/* triangle */}
        <polygon
          points={`16,${cy-12} 16,${cy+12} ${w-16},${cy}`}
          fill={isActive ? '#fb923c44' : '#1c1c28'}
          stroke="#fb923c" strokeWidth="1.5"/>
        {/* bar */}
        <line x1={w-16} y1={cy-12} x2={w-16} y2={cy+12} stroke="#fb923c" strokeWidth="2.5"/>
      </svg>
    )

    case 'buzzer': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1={cy} x2="10" y2={cy} stroke="#888" strokeWidth="1.5"/>
        <line x1={w-10} y1={cy} x2={w} y2={cy} stroke="#888" strokeWidth="1.5"/>
        <ellipse cx={cx} cy={cy} rx="22" ry="24"
          fill={isActive ? '#e879f922' : '#1a1a28'}
          stroke="#e879f9" strokeWidth="1.5"/>
        {/* sound waves */}
        {isActive ? (
          <>
            <path d={`M${cx+10},${cy-8} Q${cx+18},${cy} ${cx+10},${cy+8}`}
              fill="none" stroke="#e879f9" strokeWidth="1.5" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite"/>
            </path>
            <path d={`M${cx+14},${cy-14} Q${cx+26},${cy} ${cx+14},${cy+14}`}
              fill="none" stroke="#e879f9" strokeWidth="1" opacity="0.5">
              <animate attributeName="opacity" values="0.1;0.7;0.1" dur="0.5s" repeatCount="indefinite" begin="0.1s"/>
            </path>
          </>
        ) : (
          <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
            fill="#e879f9" fontSize="16">🔊</text>
        )}
      </svg>
    )

    case 'potentiometer': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1="0" y1="26" x2="10" y2="26" stroke="#888" strokeWidth="1.5"/>
        <rect x="10" y="10" width={w-20} height="32" rx="4"
          fill="#1a2a2a" stroke="#2dd4bf" strokeWidth="1.5"/>
        <line x1={w-10} y1="26" x2={w} y2="26" stroke="#888" strokeWidth="1.5"/>
        {/* wiper */}
        <line x1={cx} y1="42" x2={cx} y2={h} stroke="#888" strokeWidth="1.5"/>
        {/* arrow */}
        <polygon points={`${cx-5},38 ${cx+5},38 ${cx},46`} fill="#2dd4bf"/>
        <text x={cx} y="28" textAnchor="middle" dominantBaseline="middle"
          fill="#2dd4bf" fontSize="9">{props?.position ?? 50}%</text>
      </svg>
    )

    case 'transistor': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* base line */}
        <line x1="0" y1="30" x2="22" y2="30" stroke="#888" strokeWidth="1.5"/>
        {/* vertical bar */}
        <line x1="22" y1="10" x2="22" y2="50" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
        {/* collector */}
        <line x1="22" y1="16" x2={w} y2="10" stroke="#60a5fa" strokeWidth="1.5"/>
        {/* emitter with arrow */}
        <line x1="22" y1="44" x2={w} y2="50" stroke="#60a5fa" strokeWidth="1.5"/>
        <polygon points={`${w-10},46 ${w},50 ${w-6},56`} fill="#60a5fa"/>
        <circle cx="22" cy="30" r="14"
          fill={isActive ? '#60a5fa22' : '#1a1a28'}
          stroke="#60a5fa" strokeWidth="1.5"/>
        <text x="22" y="31" textAnchor="middle" dominantBaseline="middle"
          fill="#60a5fa" fontSize="8" fontWeight="700">B</text>
      </svg>
    )

    case 'ground': return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={cx} y1="0" x2={cx} y2="18" stroke="#94a3b8" strokeWidth="2"/>
        <line x1="4"  y1="18" x2={w-4} y2="18" stroke="#94a3b8" strokeWidth="2.5"/>
        <line x1="10" y1="26" x2={w-10} y2="26" stroke="#94a3b8" strokeWidth="2"/>
        <line x1="16" y1="34" x2={w-16} y2="34" stroke="#94a3b8" strokeWidth="1.5"/>
        <line x1="20" y1="40" x2={w-20} y2="40" stroke="#94a3b8" strokeWidth="1"/>
      </svg>
    )

    default: return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <rect x="4" y="4" width={w-8} height={h-8} rx="6"
          fill="#1c1c28" stroke="#555570" strokeWidth="1.5"/>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fill="#888" fontSize="10">{type}</text>
      </svg>
    )
  }
}

// ── Main ComponentNode ────────────────────────────────
function ComponentNode({ comp }) {
  const {
    moveComponent, selectComponent, selectedId,
    clickPin, pendingPin, simRunning, simResults,
  } = useCircuitStore()

  const def      = COMPONENT_DEFS[comp.type]
  const isSelected = selectedId === comp.id
  const simData  = simResults?.results?.[comp.id]
  const isActive = simRunning && simData?.active
  const isLedOn  = simRunning && simData?.ledOn
  const ledHex   = comp.type === 'led' ? (LED_COLOR_MAP[comp.props?.color] ?? '#ff4d6d') : null

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('pin')) return
    e.stopPropagation()
    selectComponent(comp.id)
    const startX = e.clientX - comp.x
    const startY = e.clientY - comp.y
    const onMove = (e) => {
      const x = Math.round((e.clientX - startX) / 20) * 20
      const y = Math.round((e.clientY - startY) / 20) * 20
      moveComponent(comp.id, Math.max(0, x), Math.max(0, y))
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [comp, moveComponent, selectComponent])

  const handlePinClick = useCallback((e, pinIndex) => {
    e.stopPropagation()
    clickPin(comp.id, pinIndex)
  }, [comp.id, clickPin])

  const isPinPending = (i) => pendingPin?.compId === comp.id && pendingPin?.pinIndex === i

  // PIN label สำหรับ transistor
  const PIN_LABELS = { transistor: ['B', 'C', 'E'], potentiometer: ['A', 'B', 'W'] }

  return (
    <div
      className={[
        'comp-node',
        isSelected ? 'selected' : '',
        pendingPin ? 'wiring-mode' : '',
        isActive   ? 'active'   : '',
        isLedOn    ? 'led-on'   : '',
      ].join(' ')}
      style={{
        left: comp.x, top: comp.y,
        width: def.width, height: def.height,
        '--accent':    ledHex ?? def.color,
        '--led-color': ledHex ?? 'transparent',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* SVG shape */}
      <ComponentShape
        type={comp.type}
        props={comp.props}
        isActive={isActive}
        isLedOn={isLedOn}
        ledColor={ledHex}
        width={def.width}
        height={def.height}
      />

      {/* Pins */}
      {def.pins.map((pin, i) => (
        <div
          key={i}
          className={`pin ${isPinPending(i) ? 'pin-active' : ''} ${isActive ? 'pin-live' : ''}`}
          style={{ left: pin.x - 5, top: pin.y - 5 }}
          onClick={(e) => handlePinClick(e, i)}
          title={PIN_LABELS[comp.type]?.[i] ?? `Pin ${i}`}
        />
      ))}

      {/* Sim value overlay */}
      {simRunning && simData && (
        <div className="sim-overlay">
          {simData.voltage}V
        </div>
      )}

      {/* LED glow */}
      {isLedOn && <div className="led-glow" />}
    </div>
  )
}

export default ComponentNode