import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './config'

const provider = new GoogleAuthProvider()

// Login ด้วย Google
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider)
        return result.user
    } catch (err) {
        console.error('Login failed:', err)
        return null
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth)
    } catch (err) {
        console.error('Logout failed:', err)
    }
}

// ติดตาม auth state เปลี่ยนแปลง (login/logout)
// callback จะถูกเรียกทุกครั้งที่ state เปลี่ยน
// คืนค่า unsubscribe function สำหรับ cleanup
export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback)
}