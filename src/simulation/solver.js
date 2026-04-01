import { multiply, inv, matrix } from 'mathjs'
import { COMPONENT_DEFS } from '../store/circuitStore'

/**
 * คำนวณ resistance ของแต่ละ component
 * ค่าที่ถูกต้องตาม Tinkercad:
 * - Resistor: ค่าที่ตั้งไว้
 * - LED: มีแรงดันตกคร่อม (forward voltage) ~2V ที่กระแส ~20mA
 *         จำลองเป็น resistance = Vf / If = 2 / 0.02 = 100Ω
 * - Switch closed: ~0Ω (short), open: infinite
 */
function getResistance(comp) {
  const p = comp.props || {}
  switch (comp.type) {
    case 'resistor':     return Math.max(1, p.resistance ?? 1000)
    case 'led':          return 100        // ~100Ω เพื่อให้กระแสไหลได้
    case 'switch':       return p.closed ? 0.1 : 1e12
    case 'capacitor':    return 1e6        // high impedance สำหรับ DC
    case 'diode':        return 50         // ~50Ω ตอน forward bias
    case 'buzzer':       return 8          // ~8Ω coil resistance
    case 'potentiometer':
      // แบ่งเป็น 2 ส่วน: wiper แบ่งกัน
      return Math.max(1, p.resistance ?? 5000)
    default:             return 1000
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
    // ── 1. Build node map ──────────────────────────────
    const nodeMap  = buildNodeMap(components, wires)
    const nodeList = [...new Set(Object.values(nodeMap))]

    if (nodeList.length < 2)
      return { success: false, error: 'วงจรไม่ครบ — ต้องมีอย่างน้อย 2 node' }

    // ── 2. หา Ground ──────────────────────────────────
    const groundComp = components.find(c => c.type === 'ground')
    if (!groundComp)
      return { success: false, error: 'ไม่มี Ground — ลาก Ground ลงใน canvas ด้วยนะครับ' }

    const groundNode = nodeMap[`${groundComp.id}-0`]
    if (groundNode === undefined)
      return { success: false, error: 'Ground ยังไม่ได้ต่อสาย' }

    // ── 3. หา Battery ─────────────────────────────────
    const battery = components.find(c => c.type === 'battery')
    if (!battery)
      return { success: false, error: 'ไม่มี Battery — ลาก Battery ลงใน canvas ด้วยนะครับ' }

    const battV   = getBatteryVoltage(battery)
    const battNeg = nodeMap[`${battery.id}-0`]  // pin 0 = ขั้วลบ
    const battPos = nodeMap[`${battery.id}-1`]  // pin 1 = ขั้วบวก

    // ── 4. สร้าง node index (ยกเว้น ground = 0V) ──────
    const nodeIndex = {}
    let idx = 0
    for (const node of nodeList) {
      if (node !== groundNode) nodeIndex[node] = idx++
    }
    nodeIndex[groundNode] = -1

    const n = Object.values(nodeIndex).filter(i => i >= 0).length
    if (n <= 0) return { success: false, error: 'วงจรไม่ครบ' }

    // ── 5. สร้าง Conductance matrix G และ Current vector I ──
    const G = Array.from({ length: n }, () => Array(n).fill(0))
    const I = Array(n).fill(0)

    // stamp แต่ละ component เข้า matrix
    for (const comp of components) {
      if (comp.type === 'battery' || comp.type === 'ground') continue
      const def = COMPONENT_DEFS[comp.type]
      if (!def || def.pins.length < 2) continue

      const nodeA = nodeMap[`${comp.id}-0`]
      const nodeB = nodeMap[`${comp.id}-1`]
      if (nodeA === undefined || nodeB === undefined) continue

      const R = getResistance(comp)
      const G_val = 1 / R
      const iA = nodeIndex[nodeA]
      const iB = nodeIndex[nodeB]

      if (iA >= 0) G[iA][iA] += G_val
      if (iB >= 0) G[iB][iB] += G_val
      if (iA >= 0 && iB >= 0) {
        G[iA][iB] -= G_val
        G[iB][iA] -= G_val
      }
    }

    // ── 6. Stamp battery เป็น voltage source ──────────
    // ใช้ Modified Nodal Analysis: battery มี internal resistance เล็กน้อย
    // pin (+) = battV, pin (-) = 0V (ถ้าต่อ ground)
    // inject current เข้า node บวก
    const Rint = 1.0   // internal resistance 1Ω (เหมือนแบตจริง)
    const Gint = 1 / Rint

    if (battPos !== undefined) {
      const iPos = nodeIndex[battPos]
      if (iPos >= 0) {
        G[iPos][iPos] += Gint
        I[iPos]       += Gint * battV
      }
    }
    if (battNeg !== undefined) {
      const iNeg = nodeIndex[battNeg]
      if (iNeg >= 0) {
        G[iNeg][iNeg] += Gint
        // ขั้วลบต่อ ground → inject -battV * Gint (แรงดัน 0V)
        // ถ้าขั้วลบต่อ ground โดยตรง ไม่ต้อง inject อะไร
      }
    }

    // ── 7. แก้สมการ G·V = I ───────────────────────────
    let voltages
    try {
      const Vmat = multiply(inv(matrix(G)), matrix(I))
      voltages = Array.isArray(Vmat) ? Vmat : Vmat.toArray()
    } catch {
      return {
        success: false,
        error: 'วงจรไม่สมบูรณ์ — ลองต่อสายให้ครบวงจรดูนะครับ',
      }
    }

    // map node → voltage
    const nodeVoltage = { [groundNode]: 0 }
    for (const [node, i] of Object.entries(nodeIndex)) {
      if (i >= 0) nodeVoltage[node] = Number(voltages[i]) || 0
    }

    // ── 8. คำนวณผลของแต่ละ component ─────────────────
    const results = {}

    for (const comp of components) {
      if (comp.type === 'ground') {
        results[comp.id] = { voltage: 0, current: 0, active: false }
        continue
      }
      if (comp.type === 'battery') {
        results[comp.id] = { voltage: battV, current: 0, active: true }
        continue
      }

      const nodeA = nodeMap[`${comp.id}-0`]
      const nodeB = nodeMap[`${comp.id}-1`]

      if (nodeA === undefined || nodeB === undefined) {
        results[comp.id] = { voltage: 0, current: 0, active: false }
        continue
      }

      const vA   = nodeVoltage[nodeA] ?? 0
      const vB   = nodeVoltage[nodeB] ?? 0
      const vDiff = Math.abs(vA - vB)
      const R     = getResistance(comp)
      const I_mA  = (vDiff / R) * 1000   // แปลงเป็น mA

      // LED: ติดเมื่อ voltage ข้ามมันมากกว่า forward voltage
      // Tinkercad ใช้ threshold ~1.8V สำหรับ red LED
      const fwd     = getForwardVoltage(comp)
      const isLedOn = comp.type === 'led' && vDiff >= fwd * 0.9 && I_mA > 1

      // Diode: ติดเมื่อ voltage > 0.7V
      const isDiodeOn = comp.type === 'diode' && vDiff > 0.7

      // Buzzer: ส่งเสียงเมื่อมีกระแสไหลผ่าน
      const isBuzzerOn = comp.type === 'buzzer' && I_mA > 5

      results[comp.id] = {
        voltage:    parseFloat(vDiff.toFixed(3)),
        current:    parseFloat(I_mA.toFixed(2)),
        active:     vDiff > 0.05 && I_mA > 0.01,
        ledOn:      isLedOn,
        diodeOn:    isDiodeOn,
        buzzerOn:   isBuzzerOn,
      }
    }

    return { success: true, nodeVoltage, results }

  } catch (err) {
    return { success: false, error: 'เกิดข้อผิดพลาด: ' + err.message }
  }
}

// ── Union-Find: หา node ที่ต่อกันด้วยสาย ────────────
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
    const fk = `${wire.fromComp}-${wire.fromPin}`
    const tk = `${wire.toComp}-${wire.toPin}`
    if (parent[fk] !== undefined && parent[tk] !== undefined) union(fk, tk)
  }

  const nodeMap = {}
  for (const key of Object.keys(parent)) nodeMap[key] = find(key)
  return nodeMap
}