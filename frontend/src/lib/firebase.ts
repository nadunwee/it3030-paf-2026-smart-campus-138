import { FirebaseError, initializeApp, getApps, type FirebaseOptions } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const requiredConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseConfig: FirebaseOptions = {
  ...requiredConfig,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export function isFirebaseConfigured(): boolean {
  return Object.values(requiredConfig).every(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add your Firebase web app values to frontend/.env.')
  }
  return getApps()[0] ?? initializeApp(firebaseConfig)
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

export function firebaseAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : 'Google sign-in failed.'
  }

  switch (error.code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'The browser blocked the Google sign-in popup. Allow popups and try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication settings.'
    default:
      return error.message || 'Google sign-in failed.'
  }
}
