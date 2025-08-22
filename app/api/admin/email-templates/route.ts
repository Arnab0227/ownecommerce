import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock email templates - in real app, fetch from database
    const templates = [
      {
        id: "1",
        name: "Welcome Email",
        subject: "Welcome to Our Store!",
        content: "Thank you for joining us. Enjoy shopping with exclusive offers!",
        type: "newsletter",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Order Confirmation",
        subject: "Your Order is Confirmed",
        content: "Your order #{ORDER_ID} has been confirmed and will be processed soon.",
        type: "order_update",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "3",
        name: "Promotional Offer",
        subject: "Special Discount Just for You!",
        content: "Get 20% off on your next purchase. Use code SAVE20 at checkout.",
        type: "promotion",
        created_at: "2024-01-01T00:00:00Z",
      },
    ]

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}
