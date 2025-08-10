export interface Product {
  id: string
  name: string
  model_no?: string
  description: string
  price: number
  originalPrice?: number
  category: string
  stock?: number
  imageUrl?: string
  rating?: number
  reviewsCount?: number
  isFeatured?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  email: string
  name?: string
  firebaseUid?: string
  isAdmin?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  shippingAddress: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  paymentMethod: 'cod' | 'online'
  deliveryFee: number
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  createdAt?: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  comment?: string
  createdAt: string
  user?: User
}

export interface AdminStats {
  total_products: number
  total_orders: number
  total_revenue: number
  recent_orders: number
  low_stock_products: number
  trending_products: number
}