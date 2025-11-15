"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2, UserPlus, Shield, CheckCircle, AlertTriangle } from 'lucide-react'

interface Admin {
  id: number
  email: string
  name: string | null
  created_at: string
}

export default function AdminManagementPage() {
  const { user, isAdmin, loading } = useAuth()
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [selectedAdminToRemove, setSelectedAdminToRemove] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/")
    }
  }, [user, isAdmin, loading, router])

  useEffect(() => {
    if (isAdmin) {
      fetchAdmins()
    }
  }, [isAdmin])

  const fetchAdmins = async () => {
    try {
      const token = await user?.getIdToken()
      const response = await fetch("/api/admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err)
      setError("Failed to load admins")
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      setError("Please enter an email address")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const token = await user?.getIdToken()
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newAdminEmail, action: "promote" }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to add admin")
      } else {
        setMessage(data.message || `${newAdminEmail} has been added as an admin`)
        setNewAdminEmail("")
        await fetchAdmins()
      }
    } catch (err) {
      setError("An error occurred while adding admin")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAdmin = async (email: string) => {
    setIsLoading(true)
    setError("")
    setMessage("")
    setSelectedAdminToRemove(null)

    try {
      const token = await user?.getIdToken()
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, action: "demote" }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Failed to remove admin")
      } else {
        setMessage(data.message || `${email} has been removed as an admin`)
        await fetchAdmins()
      }
    } catch (err) {
      setError("An error occurred while removing admin")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Admin Management</h1>
        </div>

        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddAdmin()}
                disabled={isLoading}
              />
              <Button
                onClick={handleAddAdmin}
                disabled={isLoading || !newAdminEmail}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Admin"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Admins ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No admins found</p>
              ) : (
                admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg border">
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Added: {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isLoading}
                          onClick={() => setSelectedAdminToRemove(admin.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialog>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedAdminToRemove && (
          <AlertDialog open={!!selectedAdminToRemove}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {selectedAdminToRemove} as an admin? They will still be able to use the store as a regular user.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedAdminToRemove(null)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedAdminToRemove && handleRemoveAdmin(selectedAdminToRemove)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove Admin
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </main>
  )
}
