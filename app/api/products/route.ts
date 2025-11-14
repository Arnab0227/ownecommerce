import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { redis, cacheKeys, cacheTTL } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("[v0] No DATABASE_URL found, returning empty array")
      return NextResponse.json([])
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    console.log("[v0] Products API called with category:", category)

    // Generate cache key based on category filter
    const cacheKey = category ? cacheKeys.categoryProducts(category) : cacheKeys.allProducts()
    const cachedProducts = await redis.get(cacheKey)

    if (cachedProducts && Array.isArray(cachedProducts)) {
      console.log("[v0] Returning cached products for category:", category || "all", "Count:", cachedProducts.length)
      return NextResponse.json(cachedProducts)
    }

    if (cachedProducts !== null) {
      console.log("[v0] Cache returned non-array data, clearing cache for key:", cacheKey)
      await redis.delete(cacheKey)
    }

    const sql = neon(process.env.DATABASE_URL)

    let query
    if (category) {
      console.log("[v0] Running database query for category:", category)
      query = sql`
        SELECT 
          id,
          name,
          description,
          price,
          original_price,
          category,
          COALESCE(stock_quantity, 0) as stock_quantity,
          image_url,
          is_featured,
          is_active,
          sku,
          material,
          care_instructions,
          featured_collections,
          created_at,
          updated_at
        FROM products 
        WHERE category = ${category}
        ORDER BY created_at DESC
      `
    } else {
      query = sql`
        SELECT 
          id,
          name,
          description,
          price,
          original_price,
          category,
          COALESCE(stock_quantity, 0) as stock_quantity,
          image_url,
          is_featured,
          is_active,
          sku,
          material,
          care_instructions,
          featured_collections,
          created_at,
          updated_at
        FROM products 
        ORDER BY created_at DESC
      `
    }

    const products = await query

    const productsArray = Array.isArray(products) ? products : []
    console.log("[v0] Database query returned", productsArray.length, "products for category:", category || "all")
    
    if (productsArray.length > 0) {
      productsArray.forEach((product: any) => {
        console.log("[v0] Product", product.id, "featured_collections:", product.featured_collections)
      })
    }

    if (productsArray.length > 0 || true) {
      // Cache even empty arrays to prevent repeated DB queries
      await redis.set(cacheKey, JSON.stringify(productsArray), cacheTTL.long)
    }

    return NextResponse.json(productsArray)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()

    const {
      name,
      description,
      price,
      original_price,
      category,
      stock_quantity,
      image_url,
      is_featured,
      is_active,
      sku,
      material,
      care_instructions,
      featured_collections,
    } = body

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

    const collectionsJson = Array.isArray(featured_collections) ? JSON.stringify(featured_collections) : "[]"

    console.log("[v0] Creating product with featured_collections:", collectionsJson)

    const result = await sql`
      INSERT INTO products (
        name,  
        description, 
        price, 
        original_price, 
        category, 
        stock_quantity, 
        image_url,
        is_featured,
        is_active,
        sku,
        material,
        care_instructions,
        featured_collections
      )
      VALUES (
        ${name},  
        ${description}, 
        ${price}, 
        ${original_price}, 
        ${category}, 
        ${stock_quantity || 0}, 
        ${image_url || `/placeholder.svg?height=400&width=300&text=${encodeURIComponent(name)}`},
        ${is_featured || false},
        ${is_active !== false},
        ${sku},
        ${material || null},
        ${care_instructions || null},
        ${collectionsJson}
      )
      ON CONFLICT (sku)
      DO UPDATE SET
        stock_quantity = COALESCE(products.stock_quantity, 0) + EXCLUDED.stock_quantity,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    console.log("[v0] Product created with featured_collections:", result[0].featured_collections)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating product:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to create product", details: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const body = await request.json()

    const {
      id,
      name,
      description,
      price,
      original_price,
      category,
      stock_quantity,
      image_url,
      is_featured,
      is_active,
      sku,
      material,
      care_instructions,
      featured_collections,
    } = body

    if (!id || !name || !description || !price || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["id", "name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

    const collectionsJson = Array.isArray(featured_collections) ? JSON.stringify(featured_collections) : "[]"

    console.log("[v0] Updating product", id, "with featured_collections:", collectionsJson)

    const result = await sql`
      UPDATE products SET
        name = ${name},
        description = ${description},
        price = ${price},
        original_price = ${original_price},
        category = ${category},
        stock_quantity = ${stock_quantity || 0},
        image_url = ${image_url || `/placeholder.svg?height=400&width=300&text=${encodeURIComponent(name)}`},
        is_featured = ${is_featured || false},
        is_active = ${is_active !== false},
        sku = ${sku},
        material = ${material || null},
        care_instructions = ${care_instructions || null},
        featured_collections = ${collectionsJson},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log("[v0] Product updated with featured_collections:", result[0].featured_collections)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating product:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 })
  }
}
