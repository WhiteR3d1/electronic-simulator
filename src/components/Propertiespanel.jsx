import useCircuitStore, { COMPONENT_DEFS, getComponentValueLabel } from '../store/circuitStore'
import './PropertiesPanel.css'

const LED_COLORS = {
    Red: '#ff4d6d',
    Green: '#34d399',
    Blue: '#60a5fa',
    Yellow: '#fbbf24',
}

function PropertiesPanel() {
    const { components, selectedId, updateProp, deleteSelected, simResults, simRunning } = useCircuitStore()
    const comp = components.find(c => c.id === selectedId)

    if (!comp) {
        return (
            <aside className="props-panel empty">
                <div className="props-empty-hint">
                    <span className="props-empty-icon">↖</span>
                    <p>Select a component</p>
                    <p className="props-empty-sub">to edit its properties</p>
                </div>
            </aside>
        )
    }

    const def = COMPONENT_DEFS[comp.type]
    const simData = simResults?.results?.[comp.id]
    const accentColor = comp.type === 'led'
        ? LED_COLORS[comp.props?.color] ?? def.color
        : def.color

    return (
        <aside 
            className="props-panel" 
            style={{ '--accent': accentColor }}
            // 🛡️ ป้องกันการคลิกใน Panel แล้วทะลุไปสั่ง Deselect ใน Canvas
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="props-header">
                <div className="props-icon">{def.icon}</div>
                <div>
                    <p className="props-title">{def.label}</p>
                    <p className="props-subtitle">{getComponentValueLabel(comp)}</p>
                </div>
            </div>

            {/* Simulation results */}
            {simRunning && simData && (
                <div className="props-sim-results">
                    <p className="props-section-title">Simulation</p>
                    <div className="props-sim-grid">
                        <div className="sim-card">
                            <span className="sim-card-label">Voltage</span>
                            <span className="sim-card-value">{simData.voltage}<span className="sim-unit">V</span></span>
                        </div>
                        <div className="sim-card">
                            <span className="sim-card-label">Current</span>
                            <span className="sim-card-value">{simData.current}<span className="sim-unit">mA</span></span>
                        </div>
                    </div>
                </div>
            )}

            <div className="props-section">
                <p className="props-section-title">Properties</p>
                {def.props.map((prop) => (
                    <PropField
                        key={prop.key}
                        prop={prop}
                        value={comp.props?.[prop.key] ?? prop.default}
                        onChange={(val) => updateProp(comp.id, prop.key, val)}
                    />
                ))}
            </div>

            <div className="props-footer">
                <button className="props-delete-btn" onClick={deleteSelected}>
                    🗑 Delete component
                </button>
            </div>
        </aside>
    )
}

function PropField({ prop, value, onChange }) {
    if (prop.type === 'toggle') {
        return (
            <div className="prop-row">
                <label className="prop-label">{prop.label}</label>
                <button
                    className={`prop-toggle ${value ? 'on' : 'off'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange(!value);
                    }}
                >
                    {value ? 'Closed' : 'Open'}
                </button>
            </div>
        )
    }

    if (prop.type === 'select') {
        return (
            <div className="prop-row">
                <label className="prop-label">{prop.label}</label>
                <div className="prop-select-group">
                    {prop.options.map((opt) => (
                        <button
                            key={opt}
                            className={`prop-select-opt ${value === opt ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="prop-row prop-row-input" onClick={(e) => e.stopPropagation()}>
            <label className="prop-label">{prop.label}</label>
            <div className="prop-input-wrapper">
                <input
                    type="number"
                    className="prop-number-input"
                    min={prop.min}
                    max={prop.max}
                    step={prop.step}
                    value={value}
                    // 🛠️ เปลี่ยนชื่อ parameter เป็น event เพื่อไม่ให้สับสนกับฟังก์ชัน onChange
                    onChange={(event) => {
                        const raw = event.target.value;
                        const val = raw === '' ? 0 : (prop.step < 1 ? parseFloat(raw) : parseInt(raw));
                        if (typeof onChange === 'function') {
                            onChange(val);
                        }
                    }}
                    onFocus={(event) => event.target.select()}
                    // 🛡️ ป้องกันปุ่มคีย์บอร์ดหลุดไปสั่งงาน Canvas (เช่น กด Delete แล้ววงจรหาย)
                    onKeyDown={(event) => event.stopPropagation()}
                />
                <span className="prop-input-unit">{prop.unit}</span>
            </div>
        </div>
    )
}

export default PropertiesPanel