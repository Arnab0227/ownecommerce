import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Category keywords for better matching
const CATEGORY_KEYWORDS = {
  women: [
    "night suit",
    "maxi",
    "nighty",
    "night wear",
    "alan cut nighty",
    "bodycut",
    "round neck",
    "sleeve",
    "sleeveless",
    "house coat",
    "kaftan",
    "feeding maxi",
    "fashion kurti",
    "indian kurti",
    "short kurti",
    "long kurti",
    "tshirt",
    "girls top",
    "churidar",
    "cotton churidar",
    "co-ord set",
    "coordinated set",
    "straight pant set",
    "dupatta",
    "pant jeans",
    "patiyala",
    "plazo",
    "straight leggings",
    "casual wear",
    "one piece",
    "long gown",
    "bodycon",
    "saree",
    "lehenga",
    "salwar",
  ],
  "kids-boys": ["half suit", "full suit", "t-shirt", "casual wear", "boys", "boy"],
  "kids-girls": [
    "cotton frock",
    "long frock",
    "short frock",
    "fancy frock",
    "skirt set",
    "skirts",
    "hot pant set",
    "co-ord set",
    "coordinated set",
    "capri set",
    "long gown",
    "girls",
    "girl",
    "frock",
  ],
}

// Common typos and their corrections
const TYPO_CORRECTIONS: Record<string, string> = {
  naity: "nighty",
  nity: "nighty",
  maxy: "maxi",
  kurty: "kurti",
  "co ord": "co-ord",
  coord: "co-ord",
  coordinated: "co-ord",
  tshrt: "tshirt",
  "t-shrt": "tshirt",
  plazo: "palazzo",
  plazzo: "palazzo",
  leggins: "leggings",
  churidaar: "churidar",
  dupata: "dupatta",
  bodycon: "bodycon",
  bodycn: "bodycon",
  frok: "frock",
  froks: "frocks",
}

function correctTypos(query: string): string {
  let corrected = query.toLowerCase()
  for (const [typo, correction] of Object.entries(TYPO_CORRECTIONS)) {
    corrected = corrected.replace(new RegExp(typo, "gi"), correction)
  }
  return corrected
}

function generateSearchSuggestions(query: string, userSearches: string[] = []): string[] {
  const correctedQuery = correctTypos(query)
  const suggestions: Set<string> = new Set()

  if (correctedQuery !== query.toLowerCase()) {
    suggestions.add(correctedQuery)
  }

  // Add matching user previous searches
  userSearches.forEach((search) => {
    if (search.toLowerCase().includes(query.toLowerCase()) && search.toLowerCase() !== query.toLowerCase()) {
      suggestions.add(search)
    }
  })

  const queryWords = correctedQuery.split(" ")
  Object.values(CATEGORY_KEYWORDS)
    .flat()
    .forEach((keyword) => {
      const keywordWords = keyword.split(" ")
      const hasMatch = queryWords.some((qWord) =>
        keywordWords.some((kWord) => kWord.includes(qWord) || qWord.includes(kWord)),
      )
      if (hasMatch && keyword !== correctedQuery) {
        suggestions.add(keyword)
      }
    })

  return Array.from(suggestions).slice(0, 8)
}

function calculateRelevanceScore(product: any, query: string): number {
  const correctedQuery = correctTypos(query.toLowerCase())
  const name = product.name?.toLowerCase() || ""
  const description = product.description?.toLowerCase() || ""
  const category = product.category?.toLowerCase() || ""
  const modelNo = product.model_no?.toLowerCase() || ""

  let score = 0

  // Exact matches get highest scores
  if (name === correctedQuery) score += 1000
  if (name.includes(correctedQuery)) score += 500
  if (description.includes(correctedQuery)) score += 200
  if (category.includes(correctedQuery)) score += 100
  if (modelNo.includes(correctedQuery)) score += 300

  // Word-by-word matching
  const queryWords = correctedQuery.split(" ")
  queryWords.forEach((word) => {
    if (word.length > 2) {
      if (name.includes(word)) score += 50
      if (description.includes(word)) score += 25
      if (category.includes(word)) score += 15
      if (modelNo.includes(word)) score += 35
    }
  })

  return score
}

// Create search analytics table if it doesn't exist
async function ensureSearchTablesExist() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS search_analytics (
        id SERIAL PRIMARY KEY,
        query VARCHAR(255) NOT NULL,
        results_count INTEGER DEFAULT 0,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS recent_searches (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        query VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS trending_searches (
        id SERIAL PRIMARY KEY,
        query VARCHAR(255) UNIQUE NOT NULL,
        search_count INTEGER DEFAULT 1,
        last_searched TIMESTAMP DEFAULT NOW()
      )
    `
  } catch (error) {
    console.log("Search tables creation failed (may already exist):", error)
  }
}

async function getUserPreviousSearches(userId?: string | null): Promise<string[]> {
  if (!userId) return []

  try {
    const searches = await sql`
      SELECT query, created_at
      FROM recent_searches 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 10
    `
    // Remove duplicates in JavaScript instead of SQL
    const uniqueQueries = [...new Set(searches.map((s) => s.query))]
    return uniqueQueries
  } catch (error) {
    console.log("Failed to get user searches:", error)
    return []
  }
}

async function getTrendingSearches(): Promise<string[]> {
  try {
    const trending = await sql`
      SELECT query 
      FROM trending_searches 
      ORDER BY search_count DESC, last_searched DESC 
      LIMIT 8
    `
    return trending.map((t) => t.query)
  } catch (error) {
    console.log("Failed to get trending searches:", error)
    return [
      "Silk Saree",
      "Cotton Kurti",
      "Kids Frock",
      "Designer Lehenga",
      "Nighty",
      "Kurta Pajama",
      "Maxi Dress",
      "Co-ord Set",
    ]
  }
}

async function getTrendingProducts(): Promise<
  Array<{
    id: string
    name: string
    description?: string | null
    price?: number | null
    category?: string | null
    image_url?: string | null
  }>
> {
  try {
    // Prefer orders + views; fallback to created_at/rating if tables missing
    const rows = await sql /* sql */`
      WITH oi AS (
        SELECT product_id, COUNT(*) AS orders, SUM(quantity) AS qty
        FROM order_items
        GROUP BY product_id
      ),
      pv AS (
        SELECT product_id, COUNT(*) AS views
        FROM product_views
        GROUP BY product_id
      )
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.image_url,
        COALESCE(oi.orders, 0) AS orders,
        COALESCE(pv.views, 0)  AS views
      FROM products p
      LEFT JOIN oi ON oi.product_id = p.id
      LEFT JOIN pv ON pv.product_id = p.id
      ORDER BY orders DESC, views DESC, p.created_at DESC
      LIMIT 8
    `
    // Map rows to the precise return shape to satisfy TypeScript
    return rows.map((r: any) => ({
      id: String(r.id),
      name: r.name,
      description: r.description ?? null,
      price: r.price ?? null,
      category: r.category ?? null,
      image_url: r.image_url ?? null,
    }))
  } catch (err) {
    try {
      const basic = await sql /* sql */`
        SELECT id, name, description, price, category, image_url
        FROM products
        ORDER BY created_at DESC
        LIMIT 8
      `
      return basic.map((r: any) => ({
        id: String(r.id),
        name: r.name,
        description: r.description ?? null,
        price: r.price ?? null,
        category: r.category ?? null,
        image_url: r.image_url ?? null,
      }))
    } catch {
      return []
    }
  }
}

async function getUserRepeatingSearches(userId?: string | null): Promise<string[]> {
  if (!userId) return []
  try {
    const rows = await sql /* sql */`
      SELECT query, COUNT(*) AS cnt
      FROM recent_searches
      WHERE user_id = ${userId}
      GROUP BY query
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 8
    `
    return rows.map((r: any) => r.query)
  } catch (err) {
    console.log("[v0] repeating searches query failed:", err)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()
    const userId = searchParams.get("user_id")

    if (!query) {
      const trendingSearches = await getTrendingSearches()
      const trendingProducts = await getTrendingProducts()
      const userRepeatingSearches = await getUserRepeatingSearches(userId)

      const normalizedTrendingProducts = trendingProducts.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description ?? "",
        price: p.price ?? 0,
        category: p.category ?? "",
        imageUrl: p.image_url ?? null,
      }))

      return NextResponse.json({
        exactMatches: [],
        suggestedMatches: [],
        suggestions: [],
        trendingSearches,
        trendingProducts: normalizedTrendingProducts,
        userRepeatingSearches,
      })
    }

    await ensureSearchTablesExist()

    try {
      if (userId) {
        await sql`
          INSERT INTO recent_searches (user_id, query, created_at)
          VALUES (${userId}, ${query}, NOW())
        `
      }

      // Update trending searches
      await sql`
        INSERT INTO trending_searches (query, search_count, last_searched)
        VALUES (${query}, 1, NOW())
        ON CONFLICT (query) 
        DO UPDATE SET 
          search_count = trending_searches.search_count + 1,
          last_searched = NOW()
      `

      await sql`
        INSERT INTO search_analytics (query, results_count, user_id, created_at)
        VALUES (${query}, 0, ${userId}, NOW())
      `
    } catch (analyticsError) {
      console.log("Analytics logging failed:", analyticsError)
    }

    // Correct typos in the query
    const correctedQuery = correctTypos(query)

    // Get all products from database - handle missing columns gracefully
    let products: any[]
    try {
      products = await sql`
        SELECT 
          id,
          name,
          model_no,
          description,
          price,
          original_price,
          category,
          COALESCE(stock_quantity, stock, 0) as stock,
          image_url,
          COALESCE(rating, 0) as rating
        FROM products 
        WHERE COALESCE(stock_quantity, stock, 0) > 0
        ORDER BY created_at DESC
      `
    } catch (error) {
      // If columns don't exist, query with basic columns only
      console.log("Some columns not found, querying with basic columns")
      try {
        products = await sql`
          SELECT 
            id,
            name,
            description,
            price,
            original_price,
            category,
            COALESCE(stock_quantity, stock, 0) as stock,
            image_url,
            COALESCE(rating, 0) as rating,
            NULL as model_no
          FROM products 
          WHERE COALESCE(stock_quantity, stock, 0) > 0
          ORDER BY created_at DESC
        `
      } catch (fallbackError) {
        // Final fallback - basic query
        products = await sql`
          SELECT 
            id,
            name,
            description,
            price,
            category,
            image_url
          FROM products 
          ORDER BY created_at DESC
        `
      }
    }

    // Simple text-based search with relevance scoring
    const searchResults = products
      .map((product) => ({
        ...product,
        relevanceScore: calculateRelevanceScore(product, query),
      }))
      .filter((product) => product.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Separate exact matches from suggested matches
    const exactMatches: any[] = []
    const suggestedMatches: any[] = []

    searchResults.forEach((product) => {
      const isExactMatch = product.relevanceScore >= 100

      if (isExactMatch) {
        exactMatches.push(product)
      } else if (product.relevanceScore > 0) {
        suggestedMatches.push(product)
      }
    })

    const userSearches = await getUserPreviousSearches(userId) // Now properly typed
    const suggestions = generateSearchSuggestions(query, userSearches)

    // Update analytics with results count
    try {
      await sql`
        UPDATE search_analytics 
        SET results_count = ${exactMatches.length + suggestedMatches.length}
        WHERE query = ${query} 
        AND created_at = (
          SELECT MAX(created_at) FROM search_analytics WHERE query = ${query}
        )
      `
    } catch (analyticsError) {
      console.log("Analytics update failed:", analyticsError)
    }

    const normalize = (p: any) => ({
      id: String(p.id),
      name: p.name,
      description: p.description ?? "",
      price: p.price ?? 0,
      category: p.category ?? "",
      imageUrl: p.image_url ?? p.imageUrl ?? null,
    })

    const normalizedExact = exactMatches.slice(0, 8).map(normalize)
    const normalizedSuggested = suggestedMatches.slice(0, 8).map(normalize)
    const trendingProducts = (await getTrendingProducts()).map(normalize)
    const userRepeatingSearches = await getUserRepeatingSearches(userId)

    return NextResponse.json({
      exactMatches: normalizedExact,
      suggestedMatches: normalizedSuggested,
      suggestions,
      trendingSearches: await getTrendingSearches(),
      trendingProducts,
      userRepeatingSearches,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        exactMatches: [],
        suggestedMatches: [],
        suggestions: [],
        trendingSearches: [],
        trendingProducts: [],
        userRepeatingSearches: [],
      },
      { status: 500 },
    )
  }
}
