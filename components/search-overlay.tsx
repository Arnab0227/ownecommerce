"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Loader2, TrendingUp } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string | null
  image_url?: string | null // accept underscore too; normalize at render
}

interface SearchResponse {
  exactMatches: SearchResult[]
  suggestedMatches: SearchResult[]
  suggestions: string[]
  trendingSearches: string[]
  trendingProducts?: SearchResult[]
  userRepeatingSearches?: string[]
}

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      const saved = localStorage.getItem("recentSearches")
      if (saved) setRecentSearches(JSON.parse(saved))
      loadTrending()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (debouncedQuery.trim().length >= 3) {
      searchProducts(debouncedQuery)
    } else {
      loadTrending()
    }
  }, [debouncedQuery, isOpen])

  const loadTrending = async () => {
    try {
      const userId = localStorage.getItem("userId") || "anonymous"
      const res = await fetch(`/api/search?user_id=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data: SearchResponse = await res.json()
        setResults(data)
      }
    } catch (e) {
      console.error("[v0] loadTrending failed:", e)
    }
  }

  const searchProducts = async (searchQuery: string) => {
    setLoading(true)
    try {
      const userId = localStorage.getItem("userId") || "anonymous"
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&user_id=${userId}`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("[v0] Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results) return
    const allResults = [...results.exactMatches, ...results.suggestedMatches]
    const totalItems = allResults.length + (results.suggestions?.length || 0)
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : -1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : totalItems - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0) {
        if (selectedIndex < allResults.length) {
          const selectedProduct = allResults[selectedIndex]
          handleProductClick(selectedProduct)
          return
        }
        const suggestionIndex = selectedIndex - allResults.length
        const s = results.suggestions[suggestionIndex]
        handleSearch(s)
      } else if (query.trim()) {
        handleSearch(query)
      }
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    onClose()
  }

  const getImage = (p: SearchResult) => p.imageUrl || p.image_url || "/modern-tech-product.png"

  const handleProductClick = (product: SearchResult) => {
    router.push(`/products/${product.id}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-white h-1/3 w-full shadow-xl">
        <div className="container mx-auto px-4 py-6">
          {/* Search Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(-1)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for products..."
                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-orange-500 rounded-lg"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Body */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Searching...</span>
                </div>
              ) : query.trim().length >= 3 && results ? (
                <div className="py-2">
                  {results.exactMatches?.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Exact Matches
                      </div>
                      {results.exactMatches.map((p, index) => (
                        <button
                          key={`exact-${p.id}`}
                          onClick={() => handleProductClick(p)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${
                            selectedIndex === index ? "bg-gray-100" : ""
                          }`}
                        >
                          <img
                            src={getImage(p) || "/placeholder.svg"}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">{p.description}</p>
                            {typeof p.price === "number" && (
                              <p className="text-sm font-semibold text-orange-600">
                                ₹{p.price.toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.suggestedMatches?.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Related Products
                      </div>
                      {results.suggestedMatches.map((p, i) => (
                        <button
                          key={`rel-${p.id}`}
                          onClick={() => handleProductClick(p)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${
                            selectedIndex === (results.exactMatches?.length || 0) + i ? "bg-gray-100" : ""
                          }`}
                        >
                          <img
                            src={getImage(p) || "/placeholder.svg"}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">{p.description}</p>
                            {typeof p.price === "number" && (
                              <p className="text-sm font-semibold text-orange-600">
                                ₹{p.price.toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.suggestions?.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Search Suggestions
                      </div>
                      {results.suggestions.map((s, i) => (
                        <button
                          key={`sugg-${s}`}
                          onClick={() => handleSearch(s)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 ${
                            selectedIndex ===
                            (results.exactMatches?.length || 0) + (results.suggestedMatches?.length || 0) + i
                              ? "bg-gray-100"
                              : ""
                          }`}
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!results.exactMatches?.length &&
                    !results.suggestedMatches?.length &&
                    !results.suggestions?.length && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">No products found for "{query}"</div>
                    )}
                </div>
              ) : (
                <div className="py-2">
                  {results?.userRepeatingSearches?.length ? (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Your frequent searches
                      </div>
                      {results.userRepeatingSearches.map((term) => (
                        <button
                          key={`repeat-${term}`}
                          onClick={() => handleSearch(term)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{term}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {results?.trendingProducts?.length ? (
                    <div className="mb-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Trending Products
                      </div>
                      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        {results.trendingProducts.slice(0, 6).map((p) => (
                          <button
                            key={`trend-${p.id}`}
                            onClick={() => handleProductClick(p)}
                            className="text-left rounded-md border bg-white hover:bg-gray-50 transition p-2 flex gap-2 items-center"
                          >
                            <img
                              src={getImage(p) || "/placeholder.svg"}
                              alt={p.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-gray-500 truncate">{p.category}</p>
                              {typeof p.price === "number" && (
                                <p className="text-sm font-semibold text-orange-600">
                                  ₹{p.price.toLocaleString("en-IN")}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                      Trending Searches
                    </div>
                    {(results?.trendingSearches || []).map((trend) => (
                      <button
                        key={`trend-q-${trend}`}
                        onClick={() => handleSearch(trend)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{trend}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
