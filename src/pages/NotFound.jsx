import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  // วาด circuit grid animation ด้วย canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const GRID = 40
    const nodes = []

    // สร้าง node แบบสุ่มบน grid
    for (let x = GRID; x < window.innerWidth; x += GRID) {
      for (let y = GRID; y < window.innerHeight; y += GRID) {
        if (Math.random() < 0.18) {
          nodes.push({ x, y, pulse: Math.random() * Math.PI * 2, speed: 0.02 + Math.random() * 0.03 })
        }
      }
    }

    // สร้าง wire paths ระหว่าง node ที่ใกล้กัน
    const wires = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x
        const dy = nodes[j].y - nodes[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < GRID * 2.5 && Math.random() < 0.5) {
          wires.push({ from: nodes[i], to: nodes[j], offset: Math.random() * Math.PI * 2 })
        }
      }
    }

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.012

      // วาด wire
      wires.forEach((w) => {
        const alpha = 0.08 + 0.06 * Math.sin(t + w.offset)
        ctx.beginPath()
        ctx.moveTo(w.from.x, w.from.y)
        // wire แบบ L-shape เหมือน PCB trace
        ctx.lineTo(w.from.x, w.to.y)
        ctx.lineTo(w.to.x, w.to.y)
        ctx.strokeStyle = `rgba(74, 158, 255, ${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      })

      // วาด node dots
      nodes.forEach((n) => {
        n.pulse += n.speed
        const glow = 0.3 + 0.7 * Math.abs(Math.sin(n.pulse))
        ctx.beginPath()
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 158, 255, ${glow * 0.7})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="nf-root">
      {/* animated circuit background */}
      <canvas ref={canvasRef} className="nf-canvas" />

      <div className="nf-content">
        {/* error code */}
        <div className="nf-code-wrap">
          <span className="nf-four">4</span>
          <div className="nf-circle">
            <div className="nf-circle-inner">
              <span className="nf-zero-icon">⏚</span>
            </div>
            {/* rotating ring */}
            <svg className="nf-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54"
                fill="none" stroke="#4a9eff" strokeWidth="1"
                strokeDasharray="8 6" strokeLinecap="round"
                opacity="0.4" />
              <circle cx="60" cy="60" r="54"
                fill="none" stroke="#7c6ff7" strokeWidth="1.5"
                strokeDasharray="30 200" strokeLinecap="round"
                opacity="0.8" />
            </svg>
          </div>
          <span className="nf-four">4</span>
        </div>

        <p className="nf-label">ERROR CODE</p>
        <h1 className="nf-title">Page Not Found</h1>
        <p className="nf-desc">
          Circuit open — no signal at this address.<br />
          The component you're looking for doesn't exist.
        </p>

        {/* status chips */}
        <div className="nf-chips">
          <span className="nf-chip nf-chip-red">
            <span className="nf-chip-dot" />
            No Connection
          </span>
          <span className="nf-chip nf-chip-blue">
            <span className="nf-chip-dot" />
            404
          </span>
          <span className="nf-chip nf-chip-purple">
            <span className="nf-chip-dot" />
            Open Circuit
          </span>
        </div>

        <button className="nf-btn" onClick={() => navigate('/')}>
          ← Back to Canvas
        </button>
      </div>
    </div>
  )
}

export default NotFound
