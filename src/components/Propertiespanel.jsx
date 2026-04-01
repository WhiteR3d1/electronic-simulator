import useCircuitStore, { COMPONENT_DEFS, getComponentValueLabel } from '../store/circuitStore'
import './PropertiesPanel.css'

const LED_COLORS = {
    Red: '#ff4d6d',
    Green: '#34d399',
    Blue: '#60a5fa',
    Yellow: '#fbbf24',
}

function PropertiesPanel() {
    const components = useCircuitStore((state) => state.components)
    const selectedId = useCircuitStore((state) => state.selectedId)
    const updateProp = useCircuitStore((state) => state.updateProp)
    const deleteSelected = useCircuitStore((state) => state.deleteSelected)
    const simResults = useCircuitStore((state) => state.simResults)
    const simRunning = useCircuitStore((state) => state.simRunning)

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
                {def.props.map((prop, index) => (
                    <PropField
                        key={prop.key}
                        prop={prop}
                        value={comp.props?.[prop.key] ?? prop.default}
                        // 🛠️ autoFocus field แรกเมื่อเลือก Component
                        autoFocus={index === 0}
                        onChange={(val) => {
                            if (typeof updateProp === 'function') {
                                updateProp(comp.id, prop.key, val);
                            }
                        }}
                    />
                ))}
            </div>

            <div className="props-footer">
                <button className="props-delete-btn" onClick={() => deleteSelected?.()}>
                    🗑 Delete component
                </button>
            </div>
        </aside>
    )
}

function PropField({ prop, value, onChange, autoFocus }) {
    if (prop.type === 'toggle') {
        return (
            <div className="prop-row">
                <label className="prop-label">{prop.label}</label>
                <button
                    className={`prop-toggle ${value ? 'on' : 'off'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange?.(!value);
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
                                onChange?.(opt);
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
                    // 🛠️ autoFocus: เมื่อเลือก Component ใหม่ field แรกจะ focus ทันที พิมพ์ได้เลย
                    autoFocus={autoFocus}
                    onChange={(event) => {
                        const raw = event.target.value;
                        const val = raw === '' ? 0 : Number(raw);
                        if (typeof onChange === 'function') {
                            onChange(val);
                        }
                    }}
                    // 🛠️ select all เมื่อ focus เพื่อพิมพ์ทับค่าเดิมได้เลย
                    onFocus={(event) => event.target.select()}
                    onKeyDown={(event) => event.stopPropagation()}
                />
                <span className="prop-input-unit">{prop.unit}</span>
            </div>
            <p className="prop-input-hint">{prop.min} – {prop.max} {prop.unit}</p>
        </div>
    )
}

export default PropertiesPanel