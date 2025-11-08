import { initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let storageInstance: FirebaseStorage | null = null

try {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    console.error(
      "[v0] Firebase not configured. Missing client env vars:",
      missing.join(", "),
      "→ Set them in Project Settings.",
    )
    authInstance = null
    storageInstance = null
  } else {
    app = initializeApp(firebaseConfig)
    authInstance = getAuth(app)
    storageInstance = getStorage(app)
    console.log("[v0] Firebase initialized successfully")
  }
} catch (err) {
  console.error("[v0] Firebase initialization failed:", err)
  authInstance = null
  storageInstance = null
}

export const auth = authInstance
export const storage = storageInstance
export default app
