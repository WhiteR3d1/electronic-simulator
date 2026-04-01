import { multiply, inv, matrix } from 'mathjs'
import { COMPONENT_DEFS } from '../store/circuitStore'

// ดึงค่า resistance จาก props ของ component
function getResistance(comp) {
    const props = comp.props || {}
    switch (comp.type) {
        case 'resistor': return props.resistance ?? 1000
        case 'led': return 150
        case 'switch': return props.closed ? 0.01 : 1e9  // ปิด = ต่ำมาก, เปิด = สูงมาก
        case 'capacitor': return 1e6
        default: return 1000
    }
}

function getForwardVoltage(comp) {
    return comp.props?.forwardVoltage ?? 2.0
}

function getBatteryVoltage(comp) {
    return comp.props?.voltage ?? 9
}

export function runSimulation(components, wires) {
    try {
        const nodeMap = buildNodeMap(components, wires)
        const nodeList = [...new Set(Object.values(nodeMap))]
        const nodeCount = nodeList.length

        if (nodeCount < 2) return { success: false, error: 'วงจรไม่ครบ — ต้องมีอย่างน้อย 2 node' }

        const groundComp = components.find(c => c.type === 'ground')
        if (!groundComp) return { success: false, error: 'ไม่มี Ground — ลาก Ground ลงใน canvas ด้วยนะครับ' }

        const groundPinKey = `${groundComp.id}-0`
        const groundNode = nodeMap[groundPinKey]
        if (groundNode === undefined) return { success: false, error: 'Ground ยังไม่ได้ต่อสาย' }

        const battery = components.find(c => c.type === 'battery')
        if (!battery) return { success: false, error: 'ไม่มี Battery — ลาก Battery ลงใน canvas ด้วยนะครับ' }

        const nodeIndex = {}
        let idx = 0
        for (const node of nodeList) {
            if (node !== groundNode) nodeIndex[node] = idx++
        }
        nodeIndex[groundNode] = -1

        const n = nodeCount - 1
        if (n <= 0) return { success: false, error: 'วงจรไม่ครบ' }

        const G = Array.from({ length: n }, () => Array(n).fill(0))
        const I = Array(n).fill(0)

        const battVoltage = getBatteryVoltage(battery)
        const battNeg = nodeMap[`${battery.id}-0`]
        const battPos = nodeMap[`${battery.id}-1`]

        // ใส่ conductance ของแต่ละ component
        for (const comp of components) {
            if (comp.type === 'battery' || comp.type === 'ground') continue
            const def = COMPONENT_DEFS[comp.type]
            if (!def || def.pins.length < 2) continue

            const nodeA = nodeMap[`${comp.id}-0`]
            const nodeB = nodeMap[`${comp.id}-1`]
            if (nodeA === undefined || nodeB === undefined) continue

            const resistance = getResistance(comp)
            const conductance = 1 / resistance
            const iA = nodeIndex[nodeA]
            const iB = nodeIndex[nodeB]

            if (iA >= 0) G[iA][iA] += conductance
            if (iB >= 0) G[iB][iB] += conductance
            if (iA >= 0 && iB >= 0) {
                G[iA][iB] -= conductance
                G[iB][iA] -= conductance
            }
        }

        // ใส่ battery
        const internalR = 0.1
        const internalG = 1 / internalR
        if (battPos !== undefined && nodeIndex[battPos] >= 0) {
            const i = nodeIndex[battPos]
            G[i][i] += internalG
            I[i] += internalG * battVoltage
        }
        if (battNeg !== undefined && nodeIndex[battNeg] >= 0) {
            const i = nodeIndex[battNeg]
            G[i][i] += internalG
        }

        // แก้สมการ
        let voltages
        try {
            const Vmat = multiply(inv(matrix(G)), matrix(I))
            voltages = Vmat.toArray ? Vmat.toArray() : Vmat
        } catch {
            return { success: false, error: 'วงจรไม่สมบูรณ์ — ลองต่อสายให้ครบวงจรดูนะครับ' }
        }

        const nodeVoltage = { [groundNode]: 0 }
        for (const [node, i] of Object.entries(nodeIndex)) {
            if (i >= 0) nodeVoltage[node] = voltages[i] || 0
        }

        // คำนวณผลของแต่ละ component
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

            const nodeA = nodeMap[`${comp.id}-0`]
            const nodeB = nodeMap[`${comp.id}-1`]
            if (nodeA === undefined || nodeB === undefined) {
                results[comp.id] = { voltage: 0, current: 0, active: false }
                continue
            }

            const vA = nodeVoltage[nodeA] ?? 0
            const vB = nodeVoltage[nodeB] ?? 0
            const voltageDiff = Math.abs(vA - vB)
            const resistance = getResistance(comp)
            const current = voltageDiff / resistance

            const fwd = getForwardVoltage(comp)
            const isLedOn = comp.type === 'led' && voltageDiff > fwd
            const isActive = voltageDiff > 0.1

            results[comp.id] = {
                voltage: parseFloat(voltageDiff.toFixed(2)),
                current: parseFloat((current * 1000).toFixed(2)),
                active: isActive,
                ledOn: isLedOn,
            }
        }

        return { success: true, nodeVoltage, results }

    } catch (err) {
        return { success: false, error: 'เกิดข้อผิดพลาด: ' + err.message }
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
        const toKey = `${wire.toComp}-${wire.toPin}`
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