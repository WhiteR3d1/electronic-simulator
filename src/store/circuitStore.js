import { create } from 'zustand'

// ข้อมูลของ component แต่ละประเภท
export const COMPONENT_DEFS = {
  battery: {
    label: 'Battery',
    value: '9V',
    color: '#4a9eff',
    width: 70,
    height: 46,
    icon: '⚡',
    pins: [
      { x: 0, y: 23 },   // ขาซ้าย (-)
      { x: 70, y: 23 },  // ขาขวา (+)
    ],
  },
  resistor: {
    label: 'Resistor',
    value: '1kΩ',
    color: '#f0a500',
    width: 70,
    height: 36,
    icon: '▭',
    pins: [
      { x: 0, y: 18 },
      { x: 70, y: 18 },
    ],
  },
  led: {
    label: 'LED',
    value: 'Red',
    color: '#ff4d6d',
    width: 54,
    height: 46,
    icon: '◉',
    pins: [
      { x: 0, y: 23 },
      { x: 54, y: 23 },
    ],
  },
  switch: {
    label: 'Switch',
    value: 'OFF',
    color: '#34d399',
    width: 60,
    height: 36,
    icon: '⌇',
    pins: [
      { x: 0, y: 18 },
      { x: 60, y: 18 },
    ],
  },
  capacitor: {
    label: 'Capacitor',
    value: '10µF',
    color: '#a78bfa',
    width: 58,
    height: 46,
    icon: '⊣⊢',
    pins: [
      { x: 0, y: 23 },
      { x: 58, y: 23 },
    ],
  },
  ground: {
    label: 'Ground',
    value: 'GND',
    color: '#94a3b8',
    width: 40,
    height: 46,
    icon: '⏚',
    pins: [
      { x: 20, y: 0 },  // ขาบน
    ],
  },
}

let nextId = 1

const useCircuitStore = create((set) => ({
  components: [],
  selectedId: null,

  // เพิ่ม component ใหม่ลง canvas
  addComponent: (type, x, y) => set((state) => ({
    components: [
      ...state.components,
      {
        id: nextId++,
        type,
        x,
        y,
      },
    ],
  })),

  // ย้าย component
  moveComponent: (id, x, y) => set((state) => ({
    components: state.components.map((c) =>
      c.id === id ? { ...c, x, y } : c
    ),
  })),

  // เลือก component
  selectComponent: (id) => set({ selectedId: id }),

  // ลบ component ที่เลือก
  deleteSelected: () => set((state) => ({
    components: state.components.filter((c) => c.id !== state.selectedId),
    selectedId: null,
  })),

  // ล้าง canvas ทั้งหมด
  clearAll: () => set({ components: [], selectedId: null }),
}))

export default useCircuitStore
