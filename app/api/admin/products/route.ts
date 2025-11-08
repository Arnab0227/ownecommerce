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
        p.id,
        p.name,
        p.description,
        p.price,
        p.original_price,
        p.category,
        COALESCE(p.stock_quantity, 0) as stock_quantity,
        p.image_url,
        p.is_featured,
        p.is_active,
        p.sku,
        p.material,
        p.care_instructions,
        p.created_at,
        p.updated_at,
        COALESCE(res.reserved_stock, 0) AS reserved_stock
      FROM products p
      LEFT JOIN (
        SELECT oi.product_id, SUM(oi.quantity) AS reserved_stock
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('pending','processing')
        GROUP BY oi.product_id
      ) res ON res.product_id = p.id
      ORDER BY p.created_at DESC
    `

    const productsWithStatus = products.map((product: any) => {
      const current = Number(product.stock_quantity) || 0
      const reserved = Number(product.reserved_stock) || 0
      const available = Math.max(0, current - reserved)
      const reorder_level = 10
      const status = current === 0 ? "out_of_stock" : current <= reorder_level ? "low_stock" : "in_stock"

      return {
        ...product,
        available_stock: available,
        status,
        reorder_level,
      }
    })

    return NextResponse.json(productsWithStatus)
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

    const { redis, cacheKeys } = await import("@/lib/redis")
    await redis.delete(cacheKeys.allProducts())
    await redis.delete(cacheKeys.categoryProducts(category))

    console.log("[v0] Product created successfully. Cache invalidated for category:", category)

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

    if (!id || !name || !description || !price || !category) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["id", "name", "description", "price", "category"],
        },
        { status: 400 },
      )
    }

    const sql2 = neon(process.env.DATABASE_URL)
    const originalProducts = await sql2`SELECT category FROM products WHERE id = ${id}`
    const oldCategory = originalProducts[0]?.category

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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const { redis, cacheKeys } = await import("@/lib/redis")
    await redis.delete(cacheKeys.allProducts())
    await redis.delete(cacheKeys.categoryProducts(category))
    if (oldCategory && oldCategory !== category) {
      await redis.delete(cacheKeys.categoryProducts(oldCategory))
    }
    await redis.delete(cacheKeys.productById(id))

    console.log("[v0] Product updated successfully. Cache invalidated for categories:", oldCategory, "->", category)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating product:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({ error: "Failed to update product", details: errorMessage }, { status: 500 })
  }
}
