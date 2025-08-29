"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId
  const [status, setStatus] = useState<OrderStatus>("pending")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Optional: fetch current status/fields (skipped to keep minimal)

  const onSave = async () => {
    if (!orderId) return
    if (status === "shipped" && !trackingNumber.trim()) {
      alert("Tracking number is required to mark this order as shipped.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          tracking_number: trackingNumber || undefined,
          admin_notes: adminNotes || undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      router.push("/admin/orders")
    } catch (e) {
      console.error("[EditOrder] update failed:", e)
      setLoading(false)
    }
  }

  if (!orderId) {
    return <div className="p-6">Invalid order.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Order #{orderId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">
              Tracking Number {status === "shipped" ? <span className="text-red-600">*</span> : null}
            </label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
            <p className="text-xs text-gray-500 mt-1">Required when marking order as shipped</p>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium mb-2">Admin Notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notes visible to customer (e.g. courier details, special handling)"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={onSave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
