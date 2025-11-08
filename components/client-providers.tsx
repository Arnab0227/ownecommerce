"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { Toaster } from "@/components/ui/toaster"

const ThemeProvider = dynamic(
  () => import("@/components/theme-provider").then((mod) => ({ default: mod.ThemeProvider })),
  {
    ssr: false,
  },
)

const AuthProvider = dynamic(() => import("@/hooks/use-firebase-auth").then((mod) => ({ default: mod.AuthProvider })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white" />,
})

const Navbar = dynamic(() => import("@/components/navbar").then((mod) => ({ default: mod.Navbar })), {
  ssr: false,
  loading: () => <div className="h-16 bg-white border-b" />,
})

const Footer = dynamic(() => import("@/components/footer").then((mod) => ({ default: mod.Footer })), {
  ssr: false,
})

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
