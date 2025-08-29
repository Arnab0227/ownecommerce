"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Loader2, TrendingUp, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
}

interface SearchResponse {
  exactMatches: SearchResult[]
  suggestedMatches: SearchResult[]
  suggestions: string[]
  trendingSearches: string[]
}

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [userSearchHistory, setUserSearchHistory] = useState<string[]>([])

  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const savedHistory = localStorage.getItem("searchHistory")
    if (savedHistory) {
      setUserSearchHistory(JSON.parse(savedHistory).slice(0, 5))
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      loadTrendingSearches()
    }
  }, [debouncedQuery])

  const loadTrendingSearches = async () => {
    try {
      const response = await fetch("/api/search")
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Failed to load trending searches:", error)
    }
  }

  const performSearch = async (searchQuery: string) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results) return

    const allResults = [...results.exactMatches, ...results.suggestedMatches]
    const totalItems = allResults.length + results.suggestions.length

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
          router.push(`/products/${selectedProduct.id}`)
        } else {
          const suggestionIndex = selectedIndex - allResults.length
          const selectedSuggestion = results.suggestions[suggestionIndex]
          setQuery(selectedSuggestion)
          performSearch(selectedSuggestion)
        }
      } else if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
      setIsOpen(false)
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleProductClick = (productId: string) => {
    saveSearchToHistory(query)
    router.push(`/products/${productId}`)
    setIsOpen(false)
    setQuery("")
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    performSearch(suggestion)
    inputRef.current?.focus()
  }

  const saveSearchToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const currentHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    const updatedHistory = [searchQuery, ...currentHistory.filter((h: string) => h !== searchQuery)].slice(0, 10)
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))
    setUserSearchHistory(updatedHistory.slice(0, 5))
  }

  const clearSearch = () => {
    setQuery("")
    setResults(null)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for products..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Searching...</span>
              </div>
            ) : query.trim() && results ? (
              <div className="py-2">
                {/* Exact Matches */}
                {results.exactMatches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Exact Matches
                    </div>
                    {results.exactMatches.map((product, index) => (
                      <div
                        key={product.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center space-x-3 ${
                          selectedIndex === index ? "bg-gray-100" : ""
                        }`}
                        onClick={() => handleProductClick(product.id)}
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate">{product.description}</p>
                          <p className="text-sm font-semibold text-orange-600">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Matches */}
                {results.suggestedMatches.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Related Products
                    </div>
                    {results.suggestedMatches.map((product, index) => (
                      <div
                        key={product.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center space-x-3 ${
                          selectedIndex === results.exactMatches.length + index ? "bg-gray-100" : ""
                        }`}
                        onClick={() => handleProductClick(product.id)}
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate">{product.description}</p>
                          <p className="text-sm font-semibold text-orange-600">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Suggestions */}
                {results.suggestions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Search Suggestions
                    </div>
                    {results.suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center ${
                          selectedIndex === results.exactMatches.length + results.suggestedMatches.length + index
                            ? "bg-gray-100"
                            : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Search className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {results.exactMatches.length === 0 &&
                  results.suggestedMatches.length === 0 &&
                  results.suggestions.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500">No products found for "{query}"</p>
                      <p className="text-xs text-gray-400 mt-1">Try different keywords or check spelling</p>
                    </div>
                  )}
              </div>
            ) : (
              <div className="py-2">
                {userSearchHistory.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                      <History className="h-3 w-3 mr-1" />
                      Recent Searches
                    </div>
                    {userSearchHistory.map((search) => (
                      <div
                        key={search}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center"
                        onClick={() => handleSuggestionClick(search)}
                      >
                        <History className="h-4 w-4 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{search}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending Searches
                  </div>
                  {(
                    results?.trendingSearches || [
                      "Silk Saree",
                      "Cotton Kurti",
                      "Kids Frock",
                      "Designer Lehenga",
                      "Nighty",
                      "Kurta Pajama",
                      "Maxi Dress",
                      "Co-ord Set",
                    ]
                  ).map((trend) => (
                    <div
                      key={trend}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center"
                      onClick={() => handleSuggestionClick(trend)}
                    >
                      <TrendingUp className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-700">{trend}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
