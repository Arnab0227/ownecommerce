"use client"

import { useState, useEffect } from "react"

export interface Product {
  id: string
  name: string
  description: string
  price: number
  original_price?: number // Made optional to match database schema
  imageUrl?: string
  image_url?: string // Added alternative property name for compatibility
  category: string
  stock?: number // Made optional to handle undefined values
  rating?: number
  model_no?: string
}

interface CartItem extends Product {
  quantity: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("golden-threads-cart")
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        console.log("[v0] Loaded cart from localStorage:", parsedCart)
        setItems(parsedCart)
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("golden-threads-cart", JSON.stringify(items))
        console.log("[v0] Cart saved to localStorage, dispatching event:", items.length)
        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: { items, count: items.reduce((count, item) => count + item.quantity, 0) },
          }),
        )
      } catch (error) {
        console.error("Error saving cart to localStorage:", error)
      }
    }
  }, [items, isLoaded])

  const addItem = (product: Product, quantity = 1) => {
    console.log("Adding item to cart:", product, "quantity:", quantity)

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        const updatedItems = currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
        console.log("Updated existing item, new cart:", updatedItems)
        return updatedItems
      }

      const newItems = [...currentItems, { ...product, quantity }]
      console.log("Added new item, new cart:", newItems)
      return newItems
    })
  }

  const removeItem = (productId: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter((item) => item.id !== productId)
      console.log("Removed item, new cart:", updatedItems)
      return updatedItems
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((currentItems) => {
      const updatedItems = currentItems.map((item) => (item.id === productId ? { ...item, quantity } : item))
      console.log("Updated quantity, new cart:", updatedItems)
      return updatedItems
    })
  }

  const clearCart = () => {
    console.log("[v0] Clearing cart")
    setItems([])
    try {
      localStorage.removeItem("golden-threads-cart")
      // Dispatch event to update UI immediately
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { items: [], count: 0 } }))
    } catch (error) {
      console.error("Error clearing cart:", error)
    }
  }

  // Fixed method name - was getTotalPrice, now getTotal
  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  // Keep both method names for backward compatibility
  const getTotalPrice = () => {
    return getTotal()
  }

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getTotalPrice, 
    getItemCount,
    isLoaded,
  }
}
