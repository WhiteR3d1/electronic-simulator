import { multiply, inv, matrix } from 'mathjs'
import { COMPONENT_DEFS } from '../store/circuitStore'

// ดึงค่า resistance จาก props ของ component
function getResistance(comp) {
    const props = comp.props || {}
    switch (comp.type) {
        case 'resistor':      return props.resistance ?? 1000
        case 'led':           return 150
        case 'switch':        return props.closed ? 0.01 : 1e9
        case 'capacitor':     return 1e6
        case 'diode':         return 10          // forward resistance ต่ำ (จะถูก override ด้วย logic จริง)
        case 'buzzer':        return 100
        case 'potentiometer': return props.resistance ?? 10000  // ใช้ตอน fallback เท่านั้น
        default:              return 1000
    }
}

function getForwardVoltage(comp) {
    return comp.props?.forwardVoltage ?? 2.0
}

function getBatteryVoltage(comp) {
    return comp.props?.voltage ?? 9
}

// ========== POTENTIOMETER HELPER ==========
// คืน [R_a, R_b] ของ potentiometer แบ่งที่ wiper
function getPotResistances(comp) {
    const totalR   = comp.props?.resistance ?? 10000
    const position = Math.max(0, Math.min(100, comp.props?.position ?? 50)) / 100
    return {
        ra: totalR * position,          // pin 0 → wiper (pin 2)
        rb: totalR * (1 - position),    // wiper (pin 2) → pin 1
    }
}

// ========== TRANSISTOR (NPN BJT) HELPER ==========
// คืน state ของ transistor: { saturated, active, cutoff, ice }
function getTransistorState(vbe, vce, gain) {
    const vth = 0.65  // threshold voltage base-emitter
    if (vbe < vth) return { cutoff: true, saturated: false, active: false, ice: 0 }
    const ib  = (vbe - vth) / 10000  // สมมติ base resistor ~10kΩ
    const ice = gain * ib
    const vce_sat = 0.2
    if (vce < vce_sat) return { saturated: true, cutoff: false, active: false, ice }
    return { active: true, cutoff: false, saturated: false, ice }
}

export function runSimulation(components, wires) {
    try {
        const nodeMap = buildNodeMap(components, wires)
        const nodeList = [...new Set(Object.values(nodeMap))]
        const nodeCount = nodeList.length

        if (nodeCount < 2) return { success: false, error: 'Incomplete circuit — must have at least 2 nodes' }

        const groundComp = components.find(c => c.type === 'ground')
        if (!groundComp) return { success: false, error: 'No Ground — please drag a Ground onto the canvas' }

        const groundPinKey = `${groundComp.id}-0`
        const groundNode   = nodeMap[groundPinKey]
        if (groundNode === undefined) return { success: false, error: 'Ground is not connected' }

        const battery = components.find(c => c.type === 'battery')
        if (!battery) return { success: false, error: 'No Battery — please drag a Battery onto the canvas' }

        const nodeIndex = {}
        let idx = 0
        for (const node of nodeList) {
            if (node !== groundNode) nodeIndex[node] = idx++
        }
        nodeIndex[groundNode] = -1

        const n = nodeCount - 1
        if (n <= 0) return { success: false, error: 'Incomplete circuit' }

        const G = Array.from({ length: n }, () => Array(n).fill(0))
        const I = Array(n).fill(0)

        const battVoltage = getBatteryVoltage(battery)
        const battNeg = nodeMap[`${battery.id}-0`]
        const battPos = nodeMap[`${battery.id}-1`]

        // ========== Add conductance for each component ==========
        for (const comp of components) {
            if (comp.type === 'battery' || comp.type === 'ground') continue
            const def = COMPONENT_DEFS[comp.type]
            if (!def) continue

            // ---- POTENTIOMETER (3 pins) ----
            if (comp.type === 'potentiometer') {
                const nodeA     = nodeMap[`${comp.id}-0`]  // pin A
                const nodeB     = nodeMap[`${comp.id}-1`]  // pin B
                const nodeWiper = nodeMap[`${comp.id}-2`]  // wiper

                if (nodeA === undefined || nodeB === undefined || nodeWiper === undefined) continue

                const { ra, rb } = getPotResistances(comp)
                const ga = 1 / Math.max(ra, 0.01)   // conductance A→wiper
                const gb = 1 / Math.max(rb, 0.01)   // conductance wiper→B

                const iA = nodeIndex[nodeA]
                const iW = nodeIndex[nodeWiper]
                const iB = nodeIndex[nodeB]

                // Stamp A-Wiper
                if (iA >= 0) G[iA][iA] += ga
                if (iW >= 0) G[iW][iW] += ga
                if (iA >= 0 && iW >= 0) { G[iA][iW] -= ga; G[iW][iA] -= ga }

                // Stamp Wiper-B
                if (iW >= 0) G[iW][iW] += gb
                if (iB >= 0) G[iB][iB] += gb
                if (iW >= 0 && iB >= 0) { G[iW][iB] -= gb; G[iB][iW] -= gb }

                continue
            }

            // ---- TRANSISTOR (3 pins: base=0, collector=1, emitter=2) ----
            if (comp.type === 'transistor') {
                const nodeBase     = nodeMap[`${comp.id}-0`]
                const nodeCollector = nodeMap[`${comp.id}-1`]
                const nodeEmitter  = nodeMap[`${comp.id}-2`]

                if (nodeBase === undefined || nodeCollector === undefined || nodeEmitter === undefined) continue

                const gain  = comp.props?.gain ?? 100
                // ใช้ linear model: base resistor สูง, collector-emitter = controlled conductance
                const rbRes = 10000  // internal base resistance
                const gb    = 1 / rbRes

                const iBase = nodeIndex[nodeBase]
                const iColl = nodeIndex[nodeCollector]
                const iEmit = nodeIndex[nodeEmitter]

                // Stamp base-emitter resistance
                if (iBase >= 0) G[iBase][iBase] += gb
                if (iEmit >= 0) G[iEmit][iEmit] += gb
                if (iBase >= 0 && iEmit >= 0) { G[iBase][iEmit] -= gb; G[iEmit][iBase] -= gb }

                // Collector-emitter: controlled by base
                // Simplified: gce = gain * gb (เมื่อ transistor เปิด)
                const gce = gain * gb
                if (iColl >= 0) G[iColl][iColl] += gce
                if (iEmit >= 0) G[iEmit][iEmit] += gce
                if (iColl >= 0 && iEmit >= 0) { G[iColl][iEmit] -= gce; G[iEmit][iColl] -= gce }

                continue
            }

            // ---- DIODE (จำลองแบบ piecewise linear) ----
            if (comp.type === 'diode') {
                const nodeA = nodeMap[`${comp.id}-0`]  // anode
                const nodeB = nodeMap[`${comp.id}-1`]  // cathode
                if (nodeA === undefined || nodeB === undefined) continue

                // forward: R ต่ำ (10Ω), reverse: R สูงมาก (1GΩ)
                // ใช้การประมาณครั้งแรก — forward biased เสมอถ้าไม่รู้ทิศทาง
                // จะปรับใน post-processing
                const rFwd = 10
                const conductance = 1 / rFwd
                const iA = nodeIndex[nodeA]
                const iB = nodeIndex[nodeB]

                if (iA >= 0) G[iA][iA] += conductance
                if (iB >= 0) G[iB][iB] += conductance
                if (iA >= 0 && iB >= 0) { G[iA][iB] -= conductance; G[iB][iA] -= conductance }

                // เพิ่ม voltage source จำลอง 0.7V drop ใน diode (stamp แบบ current source)
                const vd = 0.7
                if (iA >= 0) I[iA] -= conductance * vd
                if (iB >= 0) I[iB] += conductance * vd

                continue
            }

            // ---- Component ทั่วไป (2 pins) ----
            if (def.pins.length < 2) continue

            const nodeA = nodeMap[`${comp.id}-0`]
            const nodeB = nodeMap[`${comp.id}-1`]
            if (nodeA === undefined || nodeB === undefined) continue

            const resistance  = getResistance(comp)
            const conductance = 1 / resistance
            const iA = nodeIndex[nodeA]
            const iB = nodeIndex[nodeB]

            if (iA >= 0) G[iA][iA] += conductance
            if (iB >= 0) G[iB][iB] += conductance
            if (iA >= 0 && iB >= 0) { G[iA][iB] -= conductance; G[iB][iA] -= conductance }
        }

        // ---- Add battery (voltage source) ----
        const internalR = 0.1
        const internalG = 1 / internalR
        if (battPos !== undefined && nodeIndex[battPos] >= 0) {
            const i = nodeIndex[battPos]
            G[i][i] += internalG
            I[i]    += internalG * battVoltage
        }
        if (battNeg !== undefined && nodeIndex[battNeg] >= 0) {
            const i = nodeIndex[battNeg]
            G[i][i] += internalG
        }

        // ---- Solve MNA equations ----
        let voltages
        try {
            const Vmat = multiply(inv(matrix(G)), matrix(I))
            voltages = Vmat.toArray ? Vmat.toArray() : Vmat
        } catch {
            return { success: false, error: 'Incomplete circuit — try connecting wires to complete the circuit' }
        }

        const nodeVoltage = { [groundNode]: 0 }
        for (const [node, i] of Object.entries(nodeIndex)) {
            if (i >= 0) nodeVoltage[node] = voltages[i] || 0
        }

        // ========== Calculate results for each component ==========
        const results = {}
        for (const comp of components) {
            if (comp.type === 'ground') {
                results[comp.id] = { voltage: 0, current: 0, active: false }
                continue
            }
            if (comp.type === 'battery') {
                results[comp.id] = { voltage: battVoltage, current: 0, active: true }
                continue
            }

            // ---- POTENTIOMETER ----
            if (comp.type === 'potentiometer') {
                const nodeA     = nodeMap[`${comp.id}-0`]
                const nodeB     = nodeMap[`${comp.id}-1`]
                const nodeWiper = nodeMap[`${comp.id}-2`]
                const vA     = nodeVoltage[nodeA]     ?? 0
                const vB     = nodeVoltage[nodeB]     ?? 0
                const vWiper = nodeVoltage[nodeWiper] ?? 0
                const { ra, rb } = getPotResistances(comp)
                const currentAW  = Math.abs(vA - vWiper) / Math.max(ra, 0.01)
                const currentWB  = Math.abs(vWiper - vB) / Math.max(rb, 0.01)
                const current    = (currentAW + currentWB) / 2
                results[comp.id] = {
                    voltage:       parseFloat(Math.abs(vA - vB).toFixed(2)),
                    voltageWiper:  parseFloat(vWiper.toFixed(2)),
                    current:       parseFloat((current * 1000).toFixed(2)),
                    active:        Math.abs(vA - vB) > 0.1,
                    position:      comp.props?.position ?? 50,
                }
                continue
            }

            // ---- TRANSISTOR ----
            if (comp.type === 'transistor') {
                const nodeBase      = nodeMap[`${comp.id}-0`]
                const nodeCollector = nodeMap[`${comp.id}-1`]
                const nodeEmitter   = nodeMap[`${comp.id}-2`]
                const vBase      = nodeVoltage[nodeBase]      ?? 0
                const vCollector = nodeVoltage[nodeCollector] ?? 0
                const vEmitter   = nodeVoltage[nodeEmitter]   ?? 0
                const vbe = vBase - vEmitter
                const vce = vCollector - vEmitter
                const gain = comp.props?.gain ?? 100
                const state = getTransistorState(vbe, vce, gain)
                const ice = state.cutoff ? 0 : Math.abs(vce) / (1 / (gain / 10000))
                results[comp.id] = {
                    voltage:    parseFloat(Math.abs(vce).toFixed(2)),
                    vbe:        parseFloat(vbe.toFixed(3)),
                    vce:        parseFloat(vce.toFixed(3)),
                    current:    parseFloat((ice * 1000).toFixed(2)),
                    active:     state.active || state.saturated,
                    saturated:  state.saturated,
                    cutoff:     state.cutoff,
                    mode:       state.saturated ? 'Saturated' : state.cutoff ? 'Cutoff' : 'Active',
                }
                continue
            }

            // ---- DIODE ----
            if (comp.type === 'diode') {
                const nodeA = nodeMap[`${comp.id}-0`]  // anode
                const nodeB = nodeMap[`${comp.id}-1`]  // cathode
                if (nodeA === undefined || nodeB === undefined) {
                    results[comp.id] = { voltage: 0, current: 0, active: false }
                    continue
                }
                const vA = nodeVoltage[nodeA] ?? 0
                const vB = nodeVoltage[nodeB] ?? 0
                const vDiff = vA - vB  // positive = forward biased
                const isForward = vDiff > 0.5
                const voltageDrop = isForward ? 0.7 : 0
                const current     = isForward ? (vDiff - 0.7) / 10 : 0  // μA ถ้า reverse
                results[comp.id] = {
                    voltage:   parseFloat(Math.abs(vDiff).toFixed(2)),
                    drop:      voltageDrop,
                    current:   parseFloat((Math.max(0, current) * 1000).toFixed(2)),
                    active:    isForward,
                    forward:   isForward,
                    reverse:   !isForward,
                }
                continue
            }

            // ---- Component ทั่วไป ----
            const nodeA = nodeMap[`${comp.id}-0`]
            const nodeB = nodeMap[`${comp.id}-1`]
            if (nodeA === undefined || nodeB === undefined) {
                results[comp.id] = { voltage: 0, current: 0, active: false }
                continue
            }

            const vA = nodeVoltage[nodeA] ?? 0
            const vB = nodeVoltage[nodeB] ?? 0
            const voltageDiff = Math.abs(vA - vB)
            const resistance  = getResistance(comp)
            const current     = voltageDiff / resistance

            const fwd     = getForwardVoltage(comp)
            const isLedOn = comp.type === 'led' && voltageDiff > fwd
            const isActive = voltageDiff > 0.1

            results[comp.id] = {
                voltage: parseFloat(voltageDiff.toFixed(2)),
                current: parseFloat((current * 1000).toFixed(2)),
                active:  isActive,
                ledOn:   isLedOn,
            }
        }

        return { success: true, nodeVoltage, results }

    } catch (err) {
        return { success: false, error: 'An error occurred: ' + err.message }
    }
}

function buildNodeMap(components, wires) {
    const parent = {}
    for (const comp of components) {
        const def = COMPONENT_DEFS[comp.type]
        if (!def) continue
        for (let i = 0; i < def.pins.length; i++) {
            const key = `${comp.id}-${i}`
            parent[key] = key
        }
    }

    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x])
        return parent[x]
    }

    function union(a, b) {
        const ra = find(a), rb = find(b)
        if (ra !== rb) parent[ra] = rb
    }

    for (const wire of wires) {
        const fromKey = `${wire.fromComp}-${wire.fromPin}`
        const toKey   = `${wire.toComp}-${wire.toPin}`
        if (parent[fromKey] !== undefined && parent[toKey] !== undefined) {
            union(fromKey, toKey)
        }
    }

    const nodeMap = {}
    for (const key of Object.keys(parent)) {
        nodeMap[key] = find(key)
    }
    return nodeMap
}