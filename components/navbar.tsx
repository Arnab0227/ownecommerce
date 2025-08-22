"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Search, ShoppingCart, User, Menu, Heart, Package, Settings, LogOut, Crown, Gift } from "lucide-react"
import { useAuth } from "@/hooks/use-firebase-auth"
import { useCart } from "@/hooks/use-cart"
import { SearchOverlay } from "./search-overlay"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function Navbar() {
  const router = useRouter()
  const { user, isAdmin, signOut } = useAuth()
  const cart = useCart() // Get the entire cart object instead of destructuring
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const updateCartCount = () => {
      const count = cart.items.reduce((total, item) => total + item.quantity, 0)
      console.log("[v0] Updating cart count:", count)
      setTotalItems(count)
    }

    // Initial update
    updateCartCount()

    // Listen for cart updates
    const handleCartUpdate = (event: any) => {
      console.log("[v0] Cart updated event received", event.detail)
      if (event.detail && typeof event.detail.count === "number") {
        console.log("[v0] Setting count from event:", event.detail.count)
        setTotalItems(event.detail.count)
      } else {
        updateCartCount()
      }
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    // Also listen for storage changes in case cart is updated in another tab
    window.addEventListener("storage", (e) => {
      if (e.key === "golden-threads-cart") {
        console.log("[v0] Cart storage changed")
        updateCartCount()
      }
    })

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("storage", handleCartUpdate)
    }
  }, [cart.items]) // Depend on cart.items array instead of getItemCount function

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              <span className="text-xl font-bold text-amber-800">Golden Threads</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/categories/women"
                className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
              >
                Women
              </Link>
              <Link
                href="/categories/kids"
                className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
              >
                Kids
              </Link>
              <Link
                href="/categories/men"
                className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
              >
                Men
              </Link>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hidden md:flex">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-500 hover:bg-amber-600">
                      {totalItems}
                    </Badge>
                  )}
                  <span className="sr-only">Shopping cart</span>
                </Button>
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.displayName || user.email}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/loyalty" className="flex items-center">
                        <Crown className="mr-2 h-4 w-4" />
                        Loyalty Points
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/gift-cards" className="flex items-center">
                        <Gift className="mr-2 h-4 w-4" />
                        Gift Cards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="flex items-center">
                        <Heart className="mr-2 h-4 w-4" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center text-amber-600">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </VisuallyHidden>
                  <div className="flex flex-col space-y-4 mt-8">
                    {/* Mobile Search */}
                    <Button variant="outline" onClick={() => setIsSearchOpen(true)} className="justify-start">
                      <Search className="mr-2 h-4 w-4" />
                      Search Products
                    </Button>

                    {/* Mobile Navigation */}
                    <div className="space-y-2">
                      <Link
                        href="/categories/women"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        Women's Collection
                      </Link>
                      <Link
                        href="/categories/kids"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        Kids Collection
                      </Link>
                      <Link
                        href="/categories/men"
                        className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                      >
                        Men's Collection
                      </Link>
                    </div>

                    {user && (
                      <div className="space-y-2 pt-4 border-t">
                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Orders
                        </Link>
                        <Link
                          href="/loyalty"
                          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Loyalty Points
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
