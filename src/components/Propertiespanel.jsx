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

    // ไม่มีอะไรถูกเลือก
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
        <aside className="props-panel" style={{ '--accent': accentColor }}>
            {/* Header */}
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
                    {comp.type === 'led' && (
                        <div className={`led-status ${simData.ledOn ? 'on' : 'off'}`}>
                            <span className="led-status-dot" />
                            {simData.ledOn ? 'LED is ON' : 'LED is OFF'}
                        </div>
                    )}
                </div>
            )}

            {/* Properties */}
            {def.props.length > 0 && (
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
            )}

            {/* Delete button */}
            <div className="props-footer">
                <button className="props-delete-btn" onClick={deleteSelected}>
                    🗑 Delete component
                </button>
            </div>
        </aside>
    )
}

// แสดง field ตาม type ของ property
function PropField({ prop, value, onChange }) {
    if (prop.type === 'toggle') {
        return (
            <div className="prop-row">
                <label className="prop-label">{prop.label}</label>
                <button
                    className={`prop-toggle ${value ? 'on' : 'off'}`}
                    onClick={() => onChange(!value)}
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
                            style={value === opt ? { '--opt-color': getLedColor(opt) } : {}}
                            onClick={() => onChange(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // number slider
    return (
        <div className="prop-row prop-row-input">
            <label className="prop-label">{prop.label}</label>
            <div className="prop-input-wrapper">
                <input
                    type="number"
                    className="prop-number-input"
                    min={prop.min}
                    max={prop.max}
                    step={prop.step}
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value === '' ? 0 : (prop.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value));
                        onChange(val);
                    }}
                />
                <span className="prop-input-unit">{prop.unit}</span>
            </div>
            <div className="prop-input-hint">
                Min: {prop.min}{prop.unit} | Max: {prop.max}{prop.unit}
            </div>
        </div>
    )
}

function getLedColor(name) {
    return { Red: '#ff4d6d', Green: '#34d399', Blue: '#60a5fa', Yellow: '#fbbf24' }[name] ?? '#fff'
}

export default PropertiesPanel