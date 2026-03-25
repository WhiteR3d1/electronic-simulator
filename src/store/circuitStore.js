import { create } from 'zustand'

export const COMPONENT_DEFS = {
  battery: {
    label: 'Battery', value: '9V', color: '#4a9eff',
    width: 70, height: 46, icon: '⚡',
    pins: [{ x: 0, y: 23 }, { x: 70, y: 23 }],
  },
  resistor: {
    label: 'Resistor', value: '1kΩ', color: '#f0a500',
    width: 70, height: 36, icon: '▭',
    pins: [{ x: 0, y: 18 }, { x: 70, y: 18 }],
  },
  led: {
    label: 'LED', value: 'Red', color: '#ff4d6d',
    width: 54, height: 46, icon: '◉',
    pins: [{ x: 0, y: 23 }, { x: 54, y: 23 }],
  },
  switch: {
    label: 'Switch', value: 'OFF', color: '#34d399',
    width: 60, height: 36, icon: '⌇',
    pins: [{ x: 0, y: 18 }, { x: 60, y: 18 }],
  },
  capacitor: {
    label: 'Capacitor', value: '10µF', color: '#a78bfa',
    width: 58, height: 46, icon: '⊣⊢',
    pins: [{ x: 0, y: 23 }, { x: 58, y: 23 }],
  },
  ground: {
    label: 'Ground', value: 'GND', color: '#94a3b8',
    width: 40, height: 46, icon: '⏚',
    pins: [{ x: 20, y: 0 }],
  },
}

let nextId = 1
let nextWireId = 1

const useCircuitStore = create((set, get) => ({
  components: [],
  wires: [],
  selectedId: null,
  pendingPin: null, // pin แรกที่คลิกรอต่อสาย

  addComponent: (type, x, y) => set((state) => ({
    components: [...state.components, { id: nextId++, type, x, y }],
  })),

  moveComponent: (id, x, y) => set((state) => {
    const comp = state.components.find(c => c.id === id)
    const def = COMPONENT_DEFS[comp.type]
    const updatedWires = state.wires.map((w) => {
      let wire = { ...w }
      if (w.fromComp === id) {
        const pin = def.pins[w.fromPin]
        wire.x1 = x + pin.x
        wire.y1 = y + pin.y
      }
      if (w.toComp === id) {
        const pin = def.pins[w.toPin]
        wire.x2 = x + pin.x
        wire.y2 = y + pin.y
      }
      return wire
    })
    return {
      components: state.components.map(c => c.id === id ? { ...c, x, y } : c),
      wires: updatedWires,
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

    // ยังไม่มี pending → เซ็ต pin แรก
    if (!state.pendingPin) {
      set({ pendingPin: { compId, pinIndex, x: absX, y: absY }, selectedId: compId })
      return
    }
    // คลิก pin เดิม → ยกเลิก
    if (state.pendingPin.compId === compId && state.pendingPin.pinIndex === pinIndex) {
      set({ pendingPin: null })
      return
    }
    // ต่อสาย
    const newWire = {
      id: nextWireId++,
      fromComp: state.pendingPin.compId,
      fromPin: state.pendingPin.pinIndex,
      x1: state.pendingPin.x,
      y1: state.pendingPin.y,
      toComp: compId,
      toPin: pinIndex,
      x2: absX,
      y2: absY,
    }
    set((s) => ({ wires: [...s.wires, newWire], pendingPin: null, selectedId: null }))
  },

  cancelWire: () => set({ pendingPin: null }),

  deleteSelected: () => set((state) => ({
    components: state.components.filter(c => c.id !== state.selectedId),
    wires: state.wires.filter(w => w.fromComp !== state.selectedId && w.toComp !== state.selectedId),
    selectedId: null,
  })),

  deleteWire: (wireId) => set((state) => ({
    wires: state.wires.filter(w => w.id !== wireId),
  })),

  clearAll: () => set({ components: [], wires: [], selectedId: null, pendingPin: null }),
}))

export default useCircuitStore