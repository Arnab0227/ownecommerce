"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth"
import { auth } from "../lib/firebase-client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithFacebook: async () => {},
  signOut: async () => {},
  isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const isAdmin = user?.email === adminEmail

  useEffect(() => {
    console.log("Admin Email from env:", adminEmail)
    console.log("Current user email:", user?.email)
    console.log("Is Admin:", isAdmin)
  }, [user, adminEmail, isAdmin])

  useEffect(() => {
    if (!auth) {
      console.error("[v0] Firebase auth not initialized - missing environment variables")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email)
      setUser(user)
      setLoading(false)

      if (user) {
        await mergeGuestCartWithUserCart(user.uid)

        // Check if user was trying to checkout
        const checkoutRedirect = localStorage.getItem("checkout-redirect")
        if (checkoutRedirect === "true") {
          localStorage.removeItem("checkout-redirect")
          window.location.href = "/checkout"
        }
      }
    })

    return unsubscribe
  }, [])

  const mergeGuestCartWithUserCart = async (userId: string) => {
    try {
      const guestCart = localStorage.getItem("golden-threads-cart")
      if (!guestCart) return

      const guestItems = JSON.parse(guestCart)
      if (guestItems.length === 0) return

      console.log("[v0] Merging guest cart with user cart:", guestItems)

      // Send guest cart items to server to merge with user's cart
      const response = await fetch("/api/cart/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          guestItems,
        }),
      })

      if (response.ok) {
        console.log("[v0] Cart merged successfully")
        // Keep the cart in localStorage for immediate use
        // It will be synced with the database
      } else {
        console.error("[v0] Failed to merge cart")
      }
    } catch (error) {
      console.error("[v0] Error merging cart:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase auth not initialized. Please configure Firebase environment variables.")
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    if (!auth) {
      throw new Error("Firebase auth not initialized. Please configure Firebase environment variables.")
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      if (name && user) {
        await updateProfile(user, { displayName: name })
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase auth not initialized. Please configure Firebase environment variables.")
    }
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.addScope("profile")
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Google sign in error:", error)
      throw error
    }
  }

  const signInWithFacebook = async () => {
    if (!auth) {
      throw new Error("Firebase auth not initialized. Please configure Firebase environment variables.")
    }
    try {
      const provider = new FacebookAuthProvider()
      provider.addScope("email")
      provider.addScope("public_profile")
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Facebook sign in error:", error)
      throw error
    }
  }

  const signOut = async () => {
    if (!auth) {
      throw new Error("Firebase auth not initialized. Please configure Firebase environment variables.")
    }
    try {
      console.log("[v0] Signing out user, clearing cart...")
      localStorage.removeItem("golden-threads-cart")
      localStorage.removeItem("checkout-redirect")

      if (user?.uid) {
        localStorage.removeItem(`addresses_${user.uid}`)
        console.log("[v0] Cleared user addresses from localStorage")
      }

      // Dispatch cart update event to update UI immediately
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { items: [], count: 0 } }))

      await firebaseSignOut(auth)
      console.log("[v0] User signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
