import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveCircuit, updateCircuit } from '../firebase/circuits'
import useCircuitStore from '../store/circuitStore'
import './CanvasHeader.css'

function CanvasHeader({ user, circuitId, circuitName, setCircuitName }) {
  const navigate = useNavigate()
  const { components, wires } = useCircuitStore()
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  async function handleSave() {
    if (!user) { alert('Please login first'); return }
    setSaving(true)
    try {
      if (circuitId) {
        await updateCircuit(circuitId, circuitName, components, wires)
      } else {
        const newId = await saveCircuit(user.uid, circuitName, components, wires)
        // อัปเดต URL ให้ตรงกับ id ใหม่
        navigate(`/canvas/${newId}`, { replace: true })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Save failed — check console')
    }
    setSaving(false)
  }

  return (
    <header className="canvas-header">
      <button className="ch-back-btn" onClick={() => navigate('/')}>
        ← Home
      </button>

      <div className="ch-center">
        <span className="ch-logo">⚡</span>
        <input
          className="ch-name-input"
          value={circuitName}
          onChange={e => setCircuitName(e.target.value)}
          placeholder="Circuit name..."
          maxLength={40}
        />
      </div>

      <div className="ch-right">
        {user ? (
          <>
            <img src={user.photoURL} className="ch-avatar" alt="avatar" />
            <button
              className={`ch-save-btn ${saved ? 'saved' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : '💾 Save'}
            </button>
          </>
        ) : (
          <span className="ch-not-login">Login to save</span>
        )}
      </div>
    </header>
  )
}

export default CanvasHeader