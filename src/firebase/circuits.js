import {
    collection, addDoc, getDocs, doc,
    deleteDoc, updateDoc, query, where,
    orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION = 'circuits'

/**
 * บันทึก circuit ใหม่
 * @param {string} userId - uid ของผู้ใช้
 * @param {string} name   - ชื่อ circuit
 * @param {Array}  components
 * @param {Array}  wires
 * @returns {string} id ของ document ที่สร้าง
 */
export async function saveCircuit(userId, name, components, wires) {
    try {
        const docRef = await addDoc(collection(db, COLLECTION), {
            userId,
            name,
            components,
            wires,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
        return docRef.id
    } catch (err) {
        console.error('Save failed:', err)
        throw err
    }
}

/**
 * อัปเดต circuit ที่มีอยู่แล้ว
 * @param {string} circuitId - id ของ document
 * @param {string} name
 * @param {Array}  components
 * @param {Array}  wires
 */
export async function updateCircuit(circuitId, name, components, wires) {
    try {
        const ref = doc(db, COLLECTION, circuitId)
        await updateDoc(ref, {
            name,
            components,
            wires,
            updatedAt: serverTimestamp(),
        })
    } catch (err) {
        console.error('Update failed:', err)
        throw err
    }
}

/**
 * โหลด circuit ทั้งหมดของ user คนนี้
 * @param {string} userId
 * @returns {Array} list of circuits
 */
export async function loadUserCircuits(userId) {
    try {
        const q = query(
            collection(db, COLLECTION),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch (err) {
        console.error('Load failed:', err)
        return []
    }
}

/**
 * ลบ circuit
 * @param {string} circuitId
 */
export async function deleteCircuit(circuitId) {
    try {
        await deleteDoc(doc(db, COLLECTION, circuitId))
    } catch (err) {
        console.error('Delete failed:', err)
        throw err
    }
}