type FirebaseUser = { uid: string; displayName: string | null; email: string | null; photoURL: string | null; getIdToken: () => Promise<string> }
type FirebaseAuth = { currentUser: FirebaseUser | null }
type AuthSnapshot = { loading: boolean; user: FirebaseUser | null; error: string }

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {}
const config = { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID }
let auth: FirebaseAuth | null = null
let modules: any = null
let snapshot: AuthSnapshot = { loading: true, user: null, error: '' }
const listeners = new Set<(next: AuthSnapshot) => void>()
const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<any>
function emit(next: AuthSnapshot) { snapshot = next; listeners.forEach(listener => listener(next)) }

export function subscribeAuth(listener: (next: AuthSnapshot) => void) { listeners.add(listener); listener(snapshot); return () => listeners.delete(listener) }
export async function getFirebaseToken() { return auth?.currentUser ? auth.currentUser.getIdToken() : null }
export async function initializeFirebaseAuth() {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) { emit({ loading: false, user: null, error: 'Firebase is not configured.' }); return }
  if (auth) return
  try {
    const [app, authSdk] = await Promise.all([
      dynamicImport('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
      dynamicImport('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'),
    ])
    modules = authSdk
    const firebaseApp = app.getApps().length ? app.getApp() : app.initializeApp(config)
    auth = authSdk.getAuth(firebaseApp)
    authSdk.onAuthStateChanged(auth, (user: FirebaseUser | null) => emit({ loading: false, user, error: '' }))
  } catch { emit({ loading: false, user: null, error: 'Firebase login could not load.' }) }
}
export async function signInWithGoogle() { if (!auth || !modules) throw new Error('Firebase is not ready.'); await modules.signInWithPopup(auth, new modules.GoogleAuthProvider()) }
export async function signOut() { if (auth && modules) await modules.signOut(auth) }
