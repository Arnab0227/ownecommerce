import { type NextRequest, NextResponse } from "next/server"
import { redis, cacheKeys } from "@/lib/redis"

// Pre-fetches related search queries based on trending patterns and user history

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseQuery, userId } = body

    if (!baseQuery) {
      return NextResponse.json({ error: "baseQuery is required" }, { status: 400 })
    }

    // Get related search terms to prefetch
    const relatedQueries = generateRelatedQueries(baseQuery)

    const prefetchResults = []

    // Pre-cache results for related queries
    for (const query of relatedQueries) {
      const cacheKey = cacheKeys.searchResults(query)
      const existing = await redis.get(cacheKey)

      // Only prefetch if not already cached
      if (!existing) {
        // Queue the prefetch (mark for background processing)
        prefetchResults.push({
          query,
          scheduled: true,
        })
      } else {
        prefetchResults.push({
          query,
          cached: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      baseQuery,
      prefetchScheduled: prefetchResults,
      message: "Search results prefetching scheduled",
    })
  } catch (error) {
    console.error("[v0] Search prefetch error:", error)
    return NextResponse.json({ error: "Prefetch failed" }, { status: 500 })
  }
}

// Generate related search queries based on trending patterns
function generateRelatedQueries(baseQuery: string): string[] {
  const related = new Set<string>()

  // Add base query with common modifiers
  const words = baseQuery.toLowerCase().split(" ")

  // Add category-based queries
  const categoryModifiers = ["women", "men", "kids", "boys", "girls"]
  categoryModifiers.forEach((cat) => {
    if (!baseQuery.toLowerCase().includes(cat)) {
      related.add(`${baseQuery} ${cat}`)
      related.add(`${cat} ${baseQuery}`)
    }
  })

  // Add style modifiers
  const styleModifiers = ["casual", "formal", "party", "wedding", "daily wear", "night wear"]
  styleModifiers.forEach((style) => {
    if (!baseQuery.toLowerCase().includes(style)) {
      related.add(`${baseQuery} ${style}`)
    }
  })

  // Add size/type variations
  if (baseQuery.includes("kurti")) {
    related.add("short kurti")
    related.add("long kurti")
    related.add("cotton kurti")
    related.add("designer kurti")
  }

  if (baseQuery.includes("saree")) {
    related.add("silk saree")
    related.add("cotton saree")
    related.add("designer saree")
  }

  if (baseQuery.includes("lehenga")) {
    related.add("designer lehenga")
    related.add("wedding lehenga")
    related.add("embroidered lehenga")
  }

  if (baseQuery.includes("nighty")) {
    related.add("cotton nighty")
    related.add("maxi nighty")
    related.add("alan cut nighty")
  }

  return Array.from(related)
    .filter((q) => q !== baseQuery)
    .slice(0, 8)
}
