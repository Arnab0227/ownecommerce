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

function generateSearchSuggestions(query: string): string[] {
  const correctedQuery = correctTypos(query)
  const suggestions: Set<string> = new Set()

  if (correctedQuery !== query.toLowerCase()) {
    suggestions.add(correctedQuery)
  }

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

  return Array.from(suggestions).slice(0, 5)
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
  } catch (error) {
    console.log("Search tables creation failed (may already exist):", error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.trim()

    if (!query) {
      return NextResponse.json({
        exactMatches: [],
        suggestedMatches: [],
        suggestions: [],
      })
    }

    await ensureSearchTablesExist()

    // Log search for analytics
    try {
      await sql`
        INSERT INTO search_analytics (query, results_count, created_at)
        VALUES (${query}, 0, NOW())
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

    // Generate search suggestions
    const suggestions = generateSearchSuggestions(query)

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

    return NextResponse.json({
      exactMatches: exactMatches.slice(0, 8),
      suggestedMatches: suggestedMatches.slice(0, 8),
      suggestions,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        exactMatches: [],
        suggestedMatches: [],
        suggestions: [],
      },
      { status: 500 },
    )
  }
}
