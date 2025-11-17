"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Crown } from 'lucide-react'
import { FEATURED_COLLECTIONS, parseFeaturedCollections } from "@/lib/featured-collections"

interface Product {
  id: string
  name: string
  image_url: string
  featured_collections?: string
  price: number
}

interface Category {
  id: string
  title: string
  description: string
  color: string
  href: string
  products?: Product[]
  badgeColor?: string
  categoryImage?: string
}

export function FeaturedCategories() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Featured categories fetched products:", data.length, "total")
        setProducts(data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const categories: Category[] = [
    {
      id: "womens-hot-pick",
      title: FEATURED_COLLECTIONS["womens-hot-pick"].label,
      description: FEATURED_COLLECTIONS["womens-hot-pick"].description,
      href: "/categories/women?collection=womens-hot-pick",
      color: FEATURED_COLLECTIONS["womens-hot-pick"].bgColor,
      badgeColor: FEATURED_COLLECTIONS["womens-hot-pick"].badgeColor,
      categoryImage: "/hotpick.jpg",
    },
    {
      id: "traditional-ethnic",
      title: FEATURED_COLLECTIONS["traditional-ethnic"].label,
      description: FEATURED_COLLECTIONS["traditional-ethnic"].description,
      href: "/categories/women?collection=traditional-ethnic",
      color: FEATURED_COLLECTIONS["traditional-ethnic"].bgColor,
      badgeColor: FEATURED_COLLECTIONS["traditional-ethnic"].badgeColor,
      categoryImage: "/traditional.jpg",
    },
    {
      id: "childrens-premium",
      title: FEATURED_COLLECTIONS["childrens-premium"].label,
      description: FEATURED_COLLECTIONS["childrens-premium"].description,
      href: "/categories/kids?collection=childrens-premium",
      color: FEATURED_COLLECTIONS["childrens-premium"].bgColor,
      badgeColor: FEATURED_COLLECTIONS["childrens-premium"].badgeColor,
      categoryImage: "/childrens.jpg",
    },
    {
      id: "curated-casual",
      title: FEATURED_COLLECTIONS["curated-casual"].label,
      description: FEATURED_COLLECTIONS["curated-casual"].description,
      href: "/categories/women?collection=curated-casual",
      color: FEATURED_COLLECTIONS["curated-casual"].bgColor,
      badgeColor: FEATURED_COLLECTIONS["curated-casual"].badgeColor,
      categoryImage: "/casual.jpg",
    },
  ]

  // Map products to collections with proper parsing
  const categoriesWithProducts = categories.map((category) => ({
    ...category,
    products: products.filter((product) => {
      try {
        const collections = parseFeaturedCollections(product.featured_collections)
        console.log("[v0] Checking product", product.id, "collections:", collections, "looking for:", category.id)
        return collections.includes(category.id)
      } catch (e) {
        console.error(
          "[v0] Error parsing collections for product",
          product.id,
          "raw value:",
          product.featured_collections,
          "error:",
          e,
        )
        return false
      }
    }),
  }))

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-amber-600 mr-3" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Curated Collections</h2>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our carefully curated collections, each piece selected with the wisdom of three decades in fashion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categoriesWithProducts.map((category) => (
            <Link key={category.id} href={category.href}>
              <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border-2 border-amber-200 bg-white h-full">
                <div className="relative overflow-hidden">
                  <img
                    src={category.categoryImage || category.products?.[0]?.image_url || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}
                  ></div>
                  <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                    <Crown className="h-5 w-5 text-amber-600" />
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-2">{category.description}</p>

                  {category.badgeColor && (
                    <div className="mb-3">
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${category.badgeColor}`}>
                        Featured
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-amber-600 font-medium group-hover:text-amber-700 transition-colors">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {category.products && category.products.length > 0 && (
                      <span className="text-gray-500 text-xs bg-amber-50 px-2 py-1 rounded font-medium">
                        {category.products.length} {category.products.length === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
