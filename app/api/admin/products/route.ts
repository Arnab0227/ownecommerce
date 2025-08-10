import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Check what columns exist in the products table
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `

    const availableColumns = columnCheck.map((row) => row.column_name)
    console.log("Available columns:", availableColumns)

    // Build query based on available columns
    let products
    if (availableColumns.includes("stock_quantity")) {
      products = await sql`
        SELECT 
          id,
          name,
          description,
          price,
          (price * 1.3)::integer as "originalPrice",
          category,
          stock_quantity as stock,
          image_url as "imageUrl",
          created_at,
          updated_at,
          is_active,
          is_featured
        FROM products 
        ORDER BY created_at DESC
      `
    } else {
      products = await sql`
        SELECT 
          id,
          name,
          description,
          price,
          (price * 1.3)::integer as "originalPrice",
          category,
          stock,
          image_url as "imageUrl",
          created_at,
          updated_at,
          is_active,
          is_featured
        FROM products 
        ORDER BY created_at DESC
      `
    }

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

    const body = await request.json()
    console.log("Received product data:", body)

    const { name, description, price, originalPrice, category, stock, image_url } = body

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, price, category" },
        { status: 400 },
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    // Check what columns exist in the products table
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `

    const availableColumns = columnCheck.map((row) => row.column_name)
    console.log("Available columns:", availableColumns)

    // Insert based on available columns
    let result
    if (availableColumns.includes("stock_quantity")) {
      // Use stock_quantity column
      result = await sql`
        INSERT INTO products (
          name, 
          description, 
          price, 
          category, 
          stock_quantity, 
          image_url,
          is_active,
          is_featured
        )
        VALUES (
          ${name}, 
          ${description}, 
          ${price}, 
          ${category}, 
          ${stock || 0}, 
          ${image_url || "/placeholder.svg?height=400&width=300"},
          true,
          false
        )
        RETURNING *
      `
    } else {
      // Use stock column
      result = await sql`
        INSERT INTO products (
          name, 
          description, 
          price, 
          category, 
          stock, 
          image_url,
          is_active,
          is_featured
        )
        VALUES (
          ${name}, 
          ${description}, 
          ${price}, 
          ${category}, 
          ${stock || 0}, 
          ${image_url || "/placeholder.svg?height=400&width=300"},
          true,
          false
        )
        RETURNING *
      `
    }

    console.log("Product created successfully:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
  }
}
