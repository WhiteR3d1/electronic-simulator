import { COMPONENT_DEFS } from '../store/circuitStore'
import useCircuitStore from '../store/circuitStore'
import './Sidebar.css'

const COMPONENT_LIST = Object.keys(COMPONENT_DEFS)

function Sidebar() {
  const { components, deleteSelected, clearAll, selectedId } = useCircuitStore()

  // เมื่อเริ่ม drag จาก sidebar
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('componentType', type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <p className="section-title">Components</p>
        <div className="component-list">
          {COMPONENT_LIST.map((type) => {
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
                <div className="comp-info">
                  <span className="comp-name">{def.label}</span>
                  <span className="comp-value">{def.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="sidebar-section sidebar-bottom">
        <p className="section-title">Info</p>
        <div className="info-box">
          <span className="info-row">
            <span className="info-label">Components</span>
            <span className="info-num">{components.length}</span>
          </span>
        </div>

        <div className="action-buttons">
          <button
            className="btn btn-danger"
            onClick={deleteSelected}
            disabled={!selectedId}
          >
            🗑 Delete
          </button>
          <button className="btn btn-clear" onClick={clearAll}>
            ✕ Clear All
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
