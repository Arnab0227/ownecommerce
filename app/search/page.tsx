"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/product-card"
import { Search, Filter, SortAsc, Loader2, Sliders } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

interface SearchResult {
  id: string
  name: string
  description: string
  price: number
  original_price?: number // Made optional to match API response
  category: string
  stock?: number // Made optional to handle undefined values
  image_url?: string
  rating?: number
}

interface SearchResponse {
  exactMatches: SearchResult[]
  suggestedMatches: SearchResult[]
  suggestions: string[]
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [filterCategory, setFilterCategory] = useState("all")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [showFilters, setShowFilters] = useState(false)
  const [materialFilter, setMaterialFilter] = useState<string[]>([])
  const [ratingFilter, setRatingFilter] = useState(0)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const userId = localStorage.getItem("userId") || "anonymous"
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      performSearch(query)
      // Update URL without page reload
      window.history.pushState({}, "", `/search?q=${encodeURIComponent(query)}`)
    }
  }

  const allResults = results ? [...results.exactMatches, ...results.suggestedMatches] : []

  const filteredResults = allResults.filter((product) => {
    // Category filter
    if (filterCategory !== "all" && product.category !== filterCategory) return false

    // Price range filter
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false

    // Material filter (check if product name/description contains material keywords)
    if (materialFilter.length > 0) {
      const productText = `${product.name} ${product.description}`.toLowerCase()
      const hasMatchingMaterial = materialFilter.some((material) => productText.includes(material.toLowerCase()))
      if (!hasMatchingMaterial) return false
    }

    // Rating filter
    if (ratingFilter > 0 && (product.rating || 0) < ratingFilter) return false

    return true
  })

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "name":
        return a.name.localeCompare(b.name)
      case "rating":
        return (b.rating || 0) - (a.rating || 0)
      case "popularity":
        // Mock popularity based on lower stock = more popular
        return (a.stock || 0) - (b.stock || 0)
      default:
        return 0 // Keep original relevance order
    }
  })

  const availableMaterials = Array.from(
    new Set(
      allResults.flatMap((product) => {
        const text = `${product.name} ${product.description}`.toLowerCase()
        const materials = ["cotton", "silk", "polyester", "rayon", "linen", "chiffon", "georgette"]
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Products</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </form>

          {/* Search Info */}
          {initialQuery && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>Search results for:</span>
              <Badge variant="secondary" className="text-sm">
                {initialQuery}
              </Badge>
              {results && (
                <span>
                  ({sortedResults.length} of {allResults.length} products shown)
                </span>
              )}
            </div>
          )}
        </div>

        {results && allResults.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-gray-500" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Sliders className="h-4 w-4" />
                Advanced Filters
              </Button>
            </div>

            {showFilters && (
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price Range */}
                    <div>
                      <h4 className="font-medium mb-3">Price Range</h4>
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

                    {/* Material Filter */}
                    {availableMaterials.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Material</h4>
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

                    {/* Rating Filter */}
                    <div>
                      <h4 className="font-medium mb-3">Minimum Rating</h4>
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
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg text-gray-600">Searching...</span>
          </div>
        ) : results ? (
          <div>
            {sortedResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description,
                      price: product.price,
                      original_price: product.original_price || product.price,
                      imageUrl: product.image_url,
                      category: product.category,
                      stock: product.stock || 0, // Provide default value for stock
                      rating: product.rating,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                  {results.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Did you mean:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {results.suggestions.map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuery(suggestion)
                              performSearch(suggestion)
                            }}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : initialQuery ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Enter a search term to find products</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
