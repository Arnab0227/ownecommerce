import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { quantity, reason, type } = await request.json()
    const productId = params.id

    // Get current stock
    const product = await sql`
      SELECT stock, name FROM products WHERE id = ${productId}
    `

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const currentStock = product[0].stock
    let newStock = currentStock

    // Calculate new stock based on adjustment type
    if (type === "in") {
      newStock = currentStock + quantity
    } else if (type === "out") {
      newStock = Math.max(0, currentStock - quantity)
    } else if (type === "adjustment") {
      newStock = quantity // Direct adjustment to specific quantity
    }

    // Update product stock
    await sql`
      UPDATE products 
      SET stock = ${newStock}
      WHERE id = ${productId}
    `

    // Record stock movement
    await sql`
      INSERT INTO stock_movements (product_id, product_name, type, quantity, reason, date, user_id)
      VALUES (${productId}, ${product[0].name}, ${type}, ${quantity}, ${reason}, NOW(), 'admin')
    `

    // Return updated inventory item
    const updatedItem = await sql`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.stock as current_stock,
        p.price,
        COALESCE(i.min_stock_level, 10) as min_stock_level,
        COALESCE(i.max_stock_level, 100) as max_stock_level,
        COALESCE(i.cost_price, p.price * 0.6) as cost_price,
        COALESCE(i.supplier, 'Default Supplier') as supplier,
        COALESCE(i.last_restocked, p.created_at) as last_restocked,
        COALESCE(reserved.reserved_stock, 0) as reserved_stock,
        (p.stock - COALESCE(reserved.reserved_stock, 0)) as available_stock,
        CASE 
          WHEN p.stock = 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(i.min_stock_level, 10) THEN 'low_stock'
          ELSE 'in_stock'
        END as status
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(quantity) as reserved_stock
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('pending', 'processing')
        GROUP BY product_id
      ) reserved ON p.id = reserved.product_id
      WHERE p.id = ${productId}
    `

    return NextResponse.json(updatedItem[0])
  } catch (error) {
    console.error("Error adjusting stock:", error)
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 })
  }
}
