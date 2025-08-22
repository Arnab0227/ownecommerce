import { type NextRequest, NextResponse } from "next/server"

// Mock orders data - in a real app, this would come from your database
const mockOrders = [
  {
    id: "1",
    order_number: "GT-2024-001",
    customer_email: "john@example.com",
    customer_name: "John Doe",
    created_at: "2024-01-15T10:30:00Z",
    status: "delivered",
    total_amount: 4197,
    items: [
      {
        id: "1",
        name: "Elegant Silk Dress",
        price: 2999,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
      {
        id: "2",
        name: "Cotton Kids T-Shirt",
        price: 599,
        quantity: 2,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    shipping_address: {
      name: "John Doe",
      street: "123 Main Street, Apartment 4B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "+91 9876543210",
    },
    payment_method: "Credit Card",
    tracking_number: "GT123456789",
  },
  {
    id: "2",
    order_number: "GT-2024-002",
    customer_email: "jane@example.com",
    customer_name: "Jane Smith",
    created_at: "2024-01-20T14:15:00Z",
    status: "shipped",
    total_amount: 2199,
    items: [
      {
        id: "3",
        name: "Designer Handbag",
        price: 1999,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    shipping_address: {
      name: "Jane Smith",
      street: "456 Oak Avenue",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      phone: "+91 9876543211",
    },
    payment_method: "UPI",
    tracking_number: "GT987654321",
  },
  {
    id: "3",
    order_number: "GT-2024-003",
    customer_email: "bob@example.com",
    customer_name: "Bob Johnson",
    created_at: "2024-01-22T09:45:00Z",
    status: "processing",
    total_amount: 1898,
    items: [
      {
        id: "4",
        name: "Kids Summer Dress",
        price: 899,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
      {
        id: "5",
        name: "Women's Casual Top",
        price: 799,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    shipping_address: {
      name: "Bob Johnson",
      street: "789 Pine Street",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      phone: "+91 9876543212",
    },
    payment_method: "Cash on Delivery",
  },
  {
    id: "4",
    order_number: "GT-2024-004",
    customer_email: "alice@example.com",
    customer_name: "Alice Brown",
    created_at: "2024-01-23T16:20:00Z",
    status: "pending",
    total_amount: 3699,
    items: [
      {
        id: "6",
        name: "Formal Blazer",
        price: 3499,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    shipping_address: {
      name: "Alice Brown",
      street: "321 Elm Street",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
      phone: "+91 9876543213",
    },
    payment_method: "Net Banking",
  },
  {
    id: "5",
    order_number: "GT-2024-005",
    customer_email: "charlie@example.com",
    customer_name: "Charlie Wilson",
    created_at: "2024-01-18T11:30:00Z",
    status: "cancelled",
    total_amount: 2699,
    items: [
      {
        id: "7",
        name: "Sports Shoes",
        price: 2499,
        quantity: 1,
        image: "/placeholder.svg?height=60&width=60",
      },
    ],
    shipping_address: {
      name: "Charlie Wilson",
      street: "654 Maple Avenue",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      phone: "+91 9876543214",
    },
    payment_method: "Credit Card",
  },
]

export async function GET(request: NextRequest) {
  try {
    // In a real app, you would:
    // 1. Verify admin authentication
    // 2. Query your database for orders
    // 3. Apply any filters from query parameters

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const timeRange = searchParams.get("timeRange")

    let filteredOrders = [...mockOrders]

    // Apply status filter
    if (status && status !== "all") {
      filteredOrders = filteredOrders.filter((order) => order.status === status)
    }

    // Apply time range filter
    if (timeRange && timeRange !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (timeRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filteredOrders = filteredOrders.filter((order) => new Date(order.created_at) >= filterDate)
    }

    return NextResponse.json(filteredOrders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    // In a real app, you would:
    // 1. Verify admin authentication
    // 2. Update the order status in your database
    // 3. Send notifications to customer if needed

    console.log(`Updating order ${orderId} to status: ${status}`)

    return NextResponse.json({ success: true, message: "Order status updated" })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
