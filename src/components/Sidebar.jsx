import { COMPONENT_DEFS } from '../store/circuitStore'
import useCircuitStore from '../store/circuitStore'
import './Sidebar.css'

const GROUPS = [
  { label: 'Power',    types: ['battery', 'ground'] },
  { label: 'Basic',   types: ['resistor', 'capacitor', 'potentiometer'] },
  { label: 'Output',  types: ['led', 'buzzer'] },
  { label: 'Active',  types: ['diode', 'transistor', 'switch'] },
]

function Sidebar() {
  const { components, deleteSelected, clearAll, selectedId } = useCircuitStore()

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('componentType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="sidebar">
      {GROUPS.map((group) => (
        <div className="sidebar-group" key={group.label}>
          <p className="group-title">{group.label}</p>
          {group.types.map((type) => {
            const def = COMPONENT_DEFS[type]
            return (
              <div
                key={type}
                className="comp-card"
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                style={{ '--accent': def.color }}
              >
                <span className="comp-icon">{def.icon}</span>
                <span className="comp-name">{def.label}</span>
              </div>
            )
          })}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div className="info-box">
          <span className="info-label">On canvas</span>
          <span className="info-num" style={{ color: '#7c6ff7' }}>{components.length}</span>
        </div>
        <button className="btn btn-danger" onClick={deleteSelected} disabled={!selectedId}>
          🗑 Delete
        </button>
        <button className="btn btn-clear" onClick={clearAll}>
          ✕ Clear All
        </button>
      </div>
    </aside>
  )
}

export default Sidebar