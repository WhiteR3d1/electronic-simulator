import useCircuitStore, { COMPONENT_DEFS, getComponentValueLabel } from '../store/circuitStore'
import './PropertiesPanel.css'

const LED_COLORS = { Red: '#ff4d6d', Green: '#34d399', Blue: '#60a5fa', Yellow: '#fbbf24' }

// ── Simulation result cards ตาม component type ──────
function SimResults({ comp, simData }) {
    if (!simData) return null

    switch (comp.type) {
        case 'transistor':
            return (
                <div className="props-sim-results">
                    <p className="props-section-title">Simulation</p>
                    <div className="props-sim-grid">
                        <div className="sim-card">
                            <span className="sim-card-label">V_CE</span>
                            <span className="sim-card-value">{simData.voltage}<span className="sim-unit">V</span></span>
                        </div>
                        <div className="sim-card">
                            <span className="sim-card-label">I_C</span>
                            <span className="sim-card-value">{simData.current}<span className="sim-unit">mA</span></span>
                        </div>
                    </div>
                    <div className="sim-card" style={{ marginTop: 6 }}>
                        <span className="sim-card-label">V_BE</span>
                        <span className="sim-card-value">{simData.vBE ?? '—'}<span className="sim-unit">V</span></span>
                    </div>
                    <div className={`led-status ${simData.saturated ? 'on' : 'off'}`} style={{ marginTop: 6 }}>
                        <span className="led-status-dot" />
                        {simData.saturated ? 'Saturated (ON)' : 'Cut-off (OFF)'}
                    </div>
                </div>
            )

        case 'potentiometer':
            return (
                <div className="props-sim-results">
                    <p className="props-section-title">Simulation</p>
                    <div className="props-sim-grid">
                        <div className="sim-card">
                            <span className="sim-card-label">Wiper V</span>
                            <span className="sim-card-value">{simData.wiperVoltage ?? simData.voltage}<span className="sim-unit">V</span></span>
                        </div>
                        <div className="sim-card">
                            <span className="sim-card-label">Current</span>
                            <span className="sim-card-value">{simData.current}<span className="sim-unit">mA</span></span>
                        </div>
                    </div>
                </div>
            )

        case 'diode':
            return (
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
                    <div className={`led-status ${simData.diodeOn ? 'on' : 'off'}`} style={{ marginTop: 6 }}>
                        <span className="led-status-dot" />
                        {simData.diodeOn ? 'Forward biased' : 'Reverse biased'}
                    </div>
                </div>
            )

        case 'buzzer':
            return (
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
                    <div className={`led-status ${simData.buzzerOn ? 'on' : 'off'}`} style={{ marginTop: 6 }}>
                        <span className="led-status-dot" />
                        {simData.buzzerOn ? '🔊 Buzzing!' : 'Silent'}
                    </div>
                </div>
            )

        case 'led':
            return (
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
                    <div className={`led-status ${simData.ledOn ? 'on' : 'off'}`} style={{ marginTop: 6 }}>
                        <span className="led-status-dot" />
                        {simData.ledOn ? 'LED is ON ✓' : 'LED is OFF'}
                    </div>
                </div>
            )

        // default: battery, resistor, switch, capacitor
        default:
            return (
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
            )
    }
}

// ── Main Panel ───────────────────────────────────────
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
                    <p className="props-empty-sub" style={{ marginTop: 8, color: '#333344' }}>
                        <kbd style={{ background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: '#555570' }}>Del</kbd> to delete selected
                    </p>
                </div>
            </aside>
        )
    }

    const def = COMPONENT_DEFS[comp.type]
    const simData = simResults?.results?.[comp.id]
    const accentColor = comp.type === 'led'
        ? (LED_COLORS[comp.props?.color] ?? def.color)
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
            {simRunning && simData && <SimResults comp={comp} simData={simData} />}

            {/* Properties */}
            {def.props?.length > 0 && (
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

            {/* Delete */}
            <div className="props-footer">
                <button className="props-delete-btn" onClick={deleteSelected}>
                    🗑 Delete &nbsp;<kbd>Del</kbd>
                </button>
            </div>
        </aside>
    )
}

// ── PropField ────────────────────────────────────────
function PropField({ prop, value, onChange }) {
    if (prop.type === 'toggle') {
        return (
            <div className="prop-row">
                <label className="prop-label">{prop.label}</label>
                <button
                    className={`prop-toggle ${value ? 'on' : 'off'}`}
                    onClick={() => onChange(!value)}
                >
                    {value ? 'Closed ●' : 'Open ○'}
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

    // number input
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
                        const v = e.target.value === ''
                            ? prop.default
                            : (prop.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))
                        onChange(v)
                    }}
                />
                <span className="prop-input-unit">{prop.unit}</span>
            </div>
            <div className="prop-input-hint">
                {prop.min}{prop.unit} – {prop.max}{prop.unit}
            </div>
        </div>
    )
}

function getLedColor(name) {
    return { Red: '#ff4d6d', Green: '#34d399', Blue: '#60a5fa', Yellow: '#fbbf24' }[name] ?? '#fff'
}

export default PropertiesPanel