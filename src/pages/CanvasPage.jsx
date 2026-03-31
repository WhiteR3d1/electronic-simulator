import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { watchAuthState } from '../firebase/auth'
import { loadUserCircuits } from '../firebase/circuits'
import useCircuitStore from '../store/circuitStore'
import Canvas from '../components/Canvas'
import Sidebar from '../components/Sidebar'
import PropertiesPanel from '../components/Propertiespanel'
import CanvasHeader from '../components/CanvasHeader'
import './CanvasPage.css'

function CanvasPage() {
  const navigate = useNavigate()
  const { circuitId } = useParams()
  const [user, setUser] = useState(null)
  const { clearAll, addComponent, wires } = useCircuitStore()

  useEffect(() => {
    const unsub = watchAuthState(setUser)
    return unsub
  }, [])

  // ถ้ามี circuitId ใน URL ให้โหลด circuit นั้น
  // ใน useEffect ของ CanvasPage.jsx
  useEffect(() => {
    if (!circuitId || !user) return;

    async function load() {
      const circuits = await loadUserCircuits(user.uid);
      const found = circuits.find(c => c.id === circuitId);

      if (found) {
        // ส่งค่า found.name เข้าไปเป็น argument ตัวที่ 3 ครับ
        useCircuitStore.getState().setCircuit(
          found.components,
          found.wires,
          found.name // <--- เพิ่มตรงนี้
        );
      }
    }
    load();
  }, [circuitId, user]);

  return (
    <div className="canvas-page">
      <CanvasHeader user={user} circuitId={circuitId} />
      <div className="workspace">
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default CanvasPage
