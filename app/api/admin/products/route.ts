import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      console.log("No DATABASE_URL found, returning empty array")
      return NextResponse.json([])
    }

    const sql = neon(process.env.DATABASE_URL)

    const products = await sql`
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
        created_at,
        updated_at
      FROM products 
      ORDER BY created_at DESC
    `

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
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
    } = body

    if (!name || !description || !price || !category ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

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
        care_instructions
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
        ${care_instructions || null}
      )
      RETURNING *
    `

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
    } = body

    if (!id || !name || !description || !price || !category ) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["id", "name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

    const result = await sql`
      UPDATE products SET
        name = ${name},
        description = ${description},
        price = ${price},
        original_price = ${original_price },
        category = ${category},
        stock_quantity = ${stock_quantity || 0},
        image_url = ${image_url || `/placeholder.svg?height=400&width=300&text=${encodeURIComponent(name)}`},
        is_featured = ${is_featured || false},
        is_active = ${is_active !== false},
        sku = ${sku},
        material = ${material || null},
        care_instructions = ${care_instructions || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating product:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 })
  }
}
