"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, SlidersHorizontal, Baby, Users } from "lucide-react"
import type { Product } from "@/types"

export default function KidsCategoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [ageGroup, setAgeGroup] = useState("all")
  const [priceRange, setPriceRange] = useState("all")

  const categories = [
    { id: "all", name: "All Items", count: 0 },
    { id: "kids-girls", name: "Girls", count: 0 },
    { id: "kids-boys", name: "Boys", count: 0 },
    { id: "kids-baby", name: "Baby", count: 0 },
  ]

  const ageGroups = [
    { id: "all", name: "All Ages" },
    { id: "baby", name: "Baby (0-2 years)" },
    { id: "toddler", name: "Toddler (2-4 years)" },
    { id: "kids", name: "Kids (4-8 years)" },
    { id: "tweens", name: "Tweens (8-12 years)" },
  ]

  const priceRanges = [
    { id: "all", name: "All Prices" },
    { id: "under-500", name: "Under ₹500" },
    { id: "500-1000", name: "₹500 - ₹1,000" },
    { id: "1000-2000", name: "₹1,000 - ₹2,000" },
    { id: "above-2000", name: "Above ₹2,000" },
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?category=kids")
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "all" || product.category === selectedCategory

    let priceMatch = true
    if (priceRange === "under-500") priceMatch = product.price < 500
    else if (priceRange === "500-1000") priceMatch = product.price >= 500 && product.price <= 1000
    else if (priceRange === "1000-2000") priceMatch = product.price >= 1000 && product.price <= 2000
    else if (priceRange === "above-2000") priceMatch = product.price > 2000

    return categoryMatch && priceMatch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center mb-4">
            <Baby className="h-12 w-12 mr-4" />
            <Users className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kids' Collection</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Adorable and comfortable clothing for your little ones</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <SlidersHorizontal className="h-5 w-5 mr-2 text-pink-600" />
                  <h2 className="text-lg font-semibold">Filters</h2>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          selectedCategory === category.id
                            ? "bg-pink-100 text-pink-700 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{category.name}</span>
                          {category.count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {category.count}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group Filter */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Age Group</h3>
                  <div className="space-y-2">
                    {ageGroups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setAgeGroup(group.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          ageGroup === group.id ? "bg-orange-100 text-orange-700 font-medium" : "hover:bg-gray-100"
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range.id}
                        onClick={() => setPriceRange(range.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          priceRange === range.id ? "bg-pink-100 text-pink-700 font-medium" : "hover:bg-gray-100"
                        }`}
                      >
                        {range.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setSelectedCategory("all")
                    setAgeGroup("all")
                    setPriceRange("all")
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === "all"
                    ? "All Kids' Items"
                    : categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600">{filteredProducts.length} products found</p>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <select className="border rounded-lg px-3 py-2 text-sm">
                  <option>Sort by: Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                  <option>Customer Rating</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-80"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Baby className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters to see more results</p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all")
                    setAgeGroup("all")
                    setPriceRange("all")
                  }}
                  className="bg-gradient-to-r from-orange-500 to-pink-600"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
