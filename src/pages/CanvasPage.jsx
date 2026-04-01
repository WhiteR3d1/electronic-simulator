import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { watchAuthState } from '../firebase/auth'
import { loadUserCircuits } from '../firebase/circuits'
import useCircuitStore from '../store/circuitStore'
import Canvas from '../components/Canvas'
import Sidebar from '../components/Sidebar'
import PropertiesPanel from '../components/PropertiesPanel'
import CanvasHeader from '../components/CanvasHeader'
import './CanvasPage.css'

function CanvasPage() {
  const navigate    = useNavigate()
  const { circuitId } = useParams()
  const [user, setUser]         = useState(null)
  const [circuitName, setCircuitName] = useState('Untitled Circuit')
  const { loadCircuit, clearAll } = useCircuitStore()

  // ติดตาม auth
  useEffect(() => {
    const unsub = watchAuthState(setUser)
    return unsub
  }, [])

  // โหลด circuit จาก Firestore ถ้ามี circuitId ใน URL
  useEffect(() => {
    if (!circuitId || !user) return

    async function fetchCircuit() {
      const circuits = await loadUserCircuits(user.uid)
      const found = circuits.find(c => c.id === circuitId)
      if (!found) return

      // ใช้ loadCircuit แทน addComponent วนซ้ำ
      // เพื่อให้ id ของ component และ wire ตรงกัน
      loadCircuit(found.components ?? [], found.wires ?? [])
      setCircuitName(found.name ?? 'Untitled Circuit')
    }

    fetchCircuit()
  }, [circuitId, user])

  // ถ้าเปิดหน้าใหม่ (ไม่มี circuitId) ให้ล้าง canvas
  useEffect(() => {
    if (!circuitId) clearAll()
  }, [circuitId])

  return (
    <div className="canvas-page">
      <CanvasHeader
        user={user}
        circuitId={circuitId}
        circuitName={circuitName}
        setCircuitName={setCircuitName}
      />
      <div className="workspace">
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default CanvasPage