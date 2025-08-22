import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const result = await sql`
      SELECT 
        id, 
        name, 
        description, 
        price, 
        original_price,
        category, 
        image_url, 
        COALESCE(stock_quantity, 0) as stock_quantity,
        is_featured, 
        is_active,
        sku,
        material,
        care_instructions,
        created_at, 
        updated_at
      FROM products 
      WHERE id = ${params.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: unknown) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

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

    if (!name || !description || !price || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

    const result = await sql`
      UPDATE products 
      SET 
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error: unknown) {
    console.error("Database error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      DELETE FROM products 
      WHERE id = ${params.id}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error: unknown) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
