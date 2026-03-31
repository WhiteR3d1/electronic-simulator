import { create } from 'zustand'
import { runSimulation } from '../simulation/solver'

export const COMPONENT_DEFS = {
  battery: {
    label: 'Battery', color: '#4a9eff',
    width: 70, height: 46, icon: '⚡',
    pins: [{ x: 0, y: 23 }, { x: 70, y: 23 }],
    // properties ที่ปรับได้
    props: [
      { key: 'voltage', label: 'Voltage', unit: 'V', min: 1, max: 24, step: 0.5, default: 9 },
    ],
  },
  resistor: {
    label: 'Resistor', color: '#f0a500',
    width: 70, height: 36, icon: '▭',
    pins: [{ x: 0, y: 18 }, { x: 70, y: 18 }],
    props: [
      { key: 'resistance', label: 'Resistance', unit: 'Ω', min: 1, max: 100000, step: 100, default: 1000 },
    ],
  },
  led: {
    label: 'LED', color: '#ff4d6d',
    width: 54, height: 46, icon: '◉',
    pins: [{ x: 0, y: 23 }, { x: 54, y: 23 }],
    props: [
      { key: 'color', label: 'Color', unit: '', type: 'select', options: ['Red', 'Green', 'Blue', 'Yellow'], default: 'Red' },
      { key: 'forwardVoltage', label: 'Forward Voltage', unit: 'V', min: 1.5, max: 3.5, step: 0.1, default: 2.0 },
    ],
  },
  switch: {
    label: 'Switch', color: '#34d399',
    width: 60, height: 36, icon: '⌇',
    pins: [{ x: 0, y: 18 }, { x: 60, y: 18 }],
    props: [
      { key: 'closed', label: 'State', unit: '', type: 'toggle', default: false },
    ],
  },
  capacitor: {
    label: 'Capacitor', color: '#a78bfa',
    width: 58, height: 46, icon: '⊣⊢',
    pins: [{ x: 0, y: 23 }, { x: 58, y: 23 }],
    props: [
      { key: 'capacitance', label: 'Capacitance', unit: 'µF', min: 0.1, max: 1000, step: 1, default: 10 },
    ],
  },
  ground: {
    label: 'Ground', color: '#94a3b8',
    width: 40, height: 46, icon: '⏚',
    pins: [{ x: 20, y: 0 }],
    props: [],
  },
}

// ค่า default properties ของแต่ละ type
function getDefaultProps(type) {
  const def = COMPONENT_DEFS[type]
  const props = {}
  for (const p of def.props) {
    props[p.key] = p.default
  }
  return props
}



// สร้าง label แสดงค่าใต้ชื่อ component
export function getComponentValueLabel(comp) {
  const type = comp.type
  const props = comp.props || {}
  if (type === 'battery') return `${props.voltage ?? 9}V`
  if (type === 'resistor') {
    const r = props.resistance ?? 1000
    return r >= 1000 ? `${r / 1000}kΩ` : `${r}Ω`
  }
  if (type === 'led') return props.color ?? 'Red'
  if (type === 'switch') return props.closed ? 'Closed' : 'Open'
  if (type === 'capacitor') return `${props.capacitance ?? 10}µF`
  if (type === 'ground') return 'GND'
  return ''
}

let nextId = 1
let nextWireId = 1

const useCircuitStore = create((set, get) => ({
  components: [],
  wires: [],
  name: "Untitled Circuit", // 1. เพิ่มฟิลด์ name ตรงนี้
  // ... state อื่นๆ

  // 2. ปรับฟังก์ชัน setCircuit ให้รับ newName เพิ่ม
  setCircuit: (newComponents, newWires, newName) => {
    const comps = newComponents || [];
    const wires = newWires || [];

    // อัปเดต nextId และ nextWireId (เหมือนเดิม)
    if (comps.length > 0) {
      nextId = Math.max(...comps.map(c => c.id)) + 1;
    }
    if (wires.length > 0) {
      nextWireId = Math.max(...wires.map(w => w.id)) + 1;
    }

    set({
      components: comps,
      wires: wires,
      name: newName || "Untitled Circuit", // 3. เซตชื่อที่โหลดมาลงใน state
      selectedId: null,
      simResults: null,
      simRunning: false,
    });
  },

  // เพิ่มฟังก์ชันสำหรับเปลี่ยนชื่อด้วย (ถ้าต้องการให้พิมพ์แก้ชื่อได้)
  setName: (newName) => set({ name: newName }),

  // ... (ฟังก์ชัน addComponent, updateProp และอื่นๆ ของเดิม)

  addComponent: (type, x, y) => set((state) => ({
    components: [
      ...state.components,
      { id: nextId++, type, x, y, props: getDefaultProps(type) },
    ],
    simResults: null,
    simRunning: false,
  })),

  moveComponent: (id, x, y) => set((state) => {
    const comp = state.components.find(c => c.id === id)
    const def = COMPONENT_DEFS[comp.type]
    const updatedWires = state.wires.map((w) => {
      let wire = { ...w }
      if (w.fromComp === id) {
        const pin = def.pins[w.fromPin]
        wire.x1 = x + pin.x; wire.y1 = y + pin.y
      }
      if (w.toComp === id) {
        const pin = def.pins[w.toPin]
        wire.x2 = x + pin.x; wire.y2 = y + pin.y
      }
      return wire
    })
    return {
      components: state.components.map(c => c.id === id ? { ...c, x, y } : c),
      wires: updatedWires,
      simResults: null,
      simRunning: false,
    }
  }),

  selectComponent: (id) => set({ selectedId: id }),

  clickPin: (compId, pinIndex) => {
    const state = get()
    const comp = state.components.find(c => c.id === compId)
    const def = COMPONENT_DEFS[comp.type]
    const pin = def.pins[pinIndex]
    const absX = comp.x + pin.x
    const absY = comp.y + pin.y

    if (!state.pendingPin) {
      set({ pendingPin: { compId, pinIndex, x: absX, y: absY }, selectedId: compId })
      return
    }
    if (state.pendingPin.compId === compId && state.pendingPin.pinIndex === pinIndex) {
      set({ pendingPin: null }); return
    }
    const newWire = {
      id: nextWireId++,
      fromComp: state.pendingPin.compId, fromPin: state.pendingPin.pinIndex,
      x1: state.pendingPin.x, y1: state.pendingPin.y,
      toComp: compId, toPin: pinIndex,
      x2: absX, y2: absY,
    }
    set((s) => ({
      wires: [...s.wires, newWire],
      pendingPin: null, selectedId: null,
      simResults: null, simRunning: false,
    }))
  },

  cancelWire: () => set({ pendingPin: null }),

  deleteSelected: () => set((state) => ({
    components: state.components.filter(c => c.id !== state.selectedId),
    wires: state.wires.filter(w => w.fromComp !== state.selectedId && w.toComp !== state.selectedId),
    selectedId: null, simResults: null, simRunning: false,
  })),

  deleteWire: (wireId) => set((state) => ({
    wires: state.wires.filter(w => w.id !== wireId),
    simResults: null, simRunning: false,
  })),

  clearAll: () => set({
    components: [], wires: [], selectedId: null,
    pendingPin: null, simResults: null, simRunning: false,
  }),

  runSim: () => {
    const { components, wires } = get()
    const result = runSimulation(components, wires)
    set({ simResults: result, simRunning: result.success })
  },

  stopSim: () => set({ simRunning: false, simResults: null }),
}))

export default useCircuitStore