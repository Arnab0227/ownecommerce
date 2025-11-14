"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, SlidersHorizontal, Sliders } from 'lucide-react'
import type { Product } from "@/types"

export default function WomenCategoryPage() {
  const searchParams = useSearchParams()
  const collectionFilter = searchParams.get("collection")

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [sortBy, setSortBy] = useState("featured")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [materialFilter, setMaterialFilter] = useState<string[]>([])
  const [ratingFilter, setRatingFilter] = useState(0)

  const categories = [{ id: "all", name: "All Items", count: 0 }]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?category=women")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Women page received products:", data.length, "products")
        if (Array.isArray(data)) {
          setProducts(data)
        } else {
          console.error("[v0] API returned non-array response:", data)
          setProducts([])
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1]

    let collectionMatch = true
    if (collectionFilter) {
      try {
        const collections = product.featured_collections ? JSON.parse(product.featured_collections) : []
        collectionMatch = collections.includes(collectionFilter)
        console.log(`[v0] Product ${product.id} collections:`, collections, "filter:", collectionFilter, "match:", collectionMatch)
      } catch (error) {
        console.error(`[v0] Error parsing collections for product ${product.id}:`, error, "raw value:", product.featured_collections)
        collectionMatch = false
      }
    }

    let materialMatch = true
    if (materialFilter.length > 0) {
      const productText = `${product.name} ${product.description}`.toLowerCase()
      materialMatch = materialFilter.some((material) => productText.includes(material.toLowerCase()))
    }

    const ratingMatch = ratingFilter === 0 || (product.rating || 0) >= ratingFilter

    return priceMatch && collectionMatch && materialMatch && ratingMatch
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      case "popularity":
        return (a.stock || 0) - (b.stock || 0)
      default:
        return 0
    }
  })

  const availableMaterials = Array.from(
    new Set(
      products.flatMap((product) => {
        const text = `${product.name} ${product.description}`.toLowerCase()
        const materials = ["cotton", "silk", "polyester", "rayon", "linen", "chiffon", "georgette", "crepe"]
        return materials.filter((material) => text.includes(material))
      }),
    ),
  )

  const handleMaterialChange = (material: string, checked: boolean) => {
    if (checked) {
      setMaterialFilter([...materialFilter, material])
    } else {
      setMaterialFilter(materialFilter.filter((m) => m !== material))
    }
  }

  const getPageTitle = () => {
    if (collectionFilter === "womens-hot-pick") return "Women's Hot Pick"
    if (collectionFilter === "traditional-ethnic") return "Traditional Ethnic Wear"
    if (collectionFilter === "curated-casual") return "Curated Casual Wear"
    return "Women's Collection"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{getPageTitle()}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Discover our curated selection of elegant and trendy women's fashion
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <SlidersHorizontal className="h-5 w-5 mr-2 text-pink-600" />
                  <h2 className="text-lg font-semibold">Filters</h2>
                </div>

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

                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={10000}
                    min={0}
                    step={100}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full mb-4 flex items-center gap-2"
                >
                  <Sliders className="h-4 w-4" />
                  Advanced Filters
                </Button>

                {showAdvancedFilters && (
                  <div className="space-y-6 mb-6">
                    {availableMaterials.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">Material</h3>
                        <div className="space-y-2">
                          {availableMaterials.map((material) => (
                            <div key={material} className="flex items-center space-x-2">
                              <Checkbox
                                id={material}
                                checked={materialFilter.includes(material)}
                                onCheckedChange={(checked) => handleMaterialChange(material, checked as boolean)}
                              />
                              <label htmlFor={material} className="text-sm capitalize">
                                {material}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium mb-3">Minimum Rating</h3>
                      <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(Number(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Rating</SelectItem>
                          <SelectItem value="1">1+ Stars</SelectItem>
                          <SelectItem value="2">2+ Stars</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setSelectedCategory("all")
                    setPriceRange([0, 10000])
                    setMaterialFilter([])
                    setRatingFilter(0)
                    setSortBy("featured")
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
                <p className="text-gray-600">{sortedProducts.length} products found</p>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Sort by: Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="rating">Customer Rating</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
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
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {!loading && sortedProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Filter className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or check back soon for new arrivals</p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all")
                    setPriceRange([0, 10000])
                    setMaterialFilter([])
                    setRatingFilter(0)
                    setSortBy("featured")
                  }}
                  className="bg-gradient-to-r from-pink-600 to-purple-600"
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
