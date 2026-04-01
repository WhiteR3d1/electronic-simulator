import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogle, logout, watchAuthState } from '../firebase/auth'
import { loadUserCircuits, deleteCircuit } from '../firebase/circuits'
import './Homepage.css'

function Homepage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(false)

  // Monitor auth state
  useEffect(() => {
    const unsub = watchAuthState(async (u) => {
      setUser(u)
      if (u) {
        setLoading(true)
        const data = await loadUserCircuits(u.uid)
        setCircuits(data)
        setLoading(false)
      } else {
        setCircuits([])
      }
    })
    return unsub
  }, [])

  async function handleLogin() {
    await loginWithGoogle()
  }

  async function handleLogout() {
    await logout()
    setUser(null)
    setCircuits([])
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this circuit?')) return
    await deleteCircuit(id)
    setCircuits(prev => prev.filter(c => c.id !== id))
  }

  function formatDate(ts) {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="homepage">
      {/* ── Navbar ── */}
      <nav className="hp-nav">
        <div className="hp-nav-left">
          <span className="hp-nav-logo">⚡</span>
          <span className="hp-nav-title">Circuit Sim</span>
        </div>
        <div className="hp-nav-right">
          {user ? (
            <div className="hp-user">
              <img src={user.photoURL} className="hp-avatar" alt="avatar" />
              <span className="hp-username">{user.displayName}</span>
              <button className="hp-btn-outline" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="hp-btn-google" onClick={handleLogin}>
              <GoogleIcon /> Sign in with Google
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-badge">Electronic Simulator</div>
          <h1 className="hp-hero-title">
            Build & Simulate<br />
            <span className="hp-hero-accent">Circuits Online</span>
          </h1>
          <p className="hp-hero-desc">
            Design basic electrical circuits. Drag and drop components onto the canvas,
            connect wires, and simulate instantly — free, no installation required.
          </p>
          <div className="hp-hero-actions">
            <button
              className="hp-btn-primary"
              onClick={() => navigate('/canvas')}
            >
              + New Circuit
            </button>
            {!user && (
              <button className="hp-btn-ghost" onClick={handleLogin}>
                Login to save your work
              </button>
            )}
          </div>
        </div>

        {/* Circuit preview illustration */}
        <div className="hp-hero-illustration">
          <CircuitIllustration />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="hp-features">
        {FEATURES.map((f) => (
          <div className="hp-feature-card" key={f.title}>
            <span className="hp-feature-icon">{f.icon}</span>
            <h3 className="hp-feature-title">{f.title}</h3>
            <p className="hp-feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── My Circuits (Logged in only) ── */}
      {user && (
        <section className="hp-circuits">
          <div className="hp-circuits-header">
            <h2 className="hp-circuits-title">My Circuits</h2>
            <button className="hp-btn-primary small" onClick={() => navigate('/canvas')}>
              + New
            </button>
          </div>

          {loading ? (
            <div className="hp-loading">Loading circuits...</div>
          ) : circuits.length === 0 ? (
            <div className="hp-empty">
              <span>🔌</span>
              <p>No circuits yet — create your first one!</p>
            </div>
          ) : (
            <div className="hp-circuit-grid">
              {circuits.map((c) => (
                <div
                  key={c.id}
                  className="hp-circuit-card"
                  onClick={() => navigate(`/canvas/${c.id}`)}
                >
                  <div className="hp-circuit-preview">
                    <span className="hp-circuit-preview-icon">⚡</span>
                    <span className="hp-circuit-comp-count">
                      {c.components?.length ?? 0} components
                    </span>
                  </div>
                  <div className="hp-circuit-info">
                    <p className="hp-circuit-name">{c.name}</p>
                    <p className="hp-circuit-date">{formatDate(c.updatedAt)}</p>
                  </div>
                  <button
                    className="hp-circuit-delete"
                    onClick={(e) => handleDelete(e, c.id)}
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="hp-footer">
        <p>Built with React + Firebase · Circuit Sim © 2025</p>
      </footer>
    </div>
  )
}

// ── Features data ──
const FEATURES = [
  { icon: '🖱️', title: 'Drag & Drop', desc: 'Drag components from the sidebar and drop them directly onto the canvas.' },
  { icon: '🔌', title: 'Wire Connect', desc: 'Easily connect wires between components by clicking on their pins.' },
  { icon: '▶️', title: 'Simulate', desc: 'Press Run to instantly view voltage, current, and illuminating LEDs.' },
  { icon: '☁️', title: 'Cloud Save', desc: 'Save your circuits to Firebase and access them from anywhere.' },
]

// Google icon SVG
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// Circuit illustration
function CircuitIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="hp-circuit-svg">
      {/* wires */}
      <path d="M40 100 L80 100" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" />
      <path d="M140 100 L180 100" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" />
      <path d="M230 100 L260 100" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.8s" repeatCount="indefinite" />
      </path>
      <path d="M260 100 L260 160 L40 160 L40 100" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.8s" repeatCount="indefinite" />
      </path>

      {/* Battery */}
      <rect x="40" y="80" width="60" height="40" rx="8" fill="#1c1c28" stroke="#4a9eff" strokeWidth="1.5" />
      <text x="70" y="97" textAnchor="middle" fill="#4a9eff" fontSize="9" fontWeight="600">Battery</text>
      <text x="70" y="110" textAnchor="middle" fill="#555570" fontSize="8">9V</text>

      {/* Resistor */}
      <rect x="150" y="84" width="60" height="32" rx="8" fill="#1c1c28" stroke="#f0a500" strokeWidth="1.5" />
      <text x="180" y="97" textAnchor="middle" fill="#f0a500" fontSize="9" fontWeight="600">Resistor</text>
      <text x="180" y="109" textAnchor="middle" fill="#555570" fontSize="8">1kΩ</text>

      {/* LED */}
      <rect x="210" y="80" width="50" height="40" rx="8" fill="#2a1020" stroke="#ff4d6d" strokeWidth="1.5" />
      <text x="235" y="97" textAnchor="middle" fill="#ff4d6d" fontSize="9" fontWeight="600">LED</text>
      <text x="235" y="109" textAnchor="middle" fill="#ff4d6d" fontSize="8">ON</text>
      {/* glow */}
      <circle cx="235" cy="100" r="24" fill="#ff4d6d" opacity="0.06">
        <animate attributeName="opacity" values="0.06;0.14;0.06" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* pin dots */}
      <circle cx="40" cy="100" r="3" fill="#4a9eff" />
      <circle cx="100" cy="100" r="3" fill="#4a9eff" />
      <circle cx="150" cy="100" r="3" fill="#4a9eff" />
      <circle cx="210" cy="100" r="3" fill="#4a9eff" />
      <circle cx="260" cy="100" r="3" fill="#4a9eff" />
    </svg>
  )
}

export default Homepage