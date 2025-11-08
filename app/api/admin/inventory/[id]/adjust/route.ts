import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { quantity, reason, type = "adjustment" } = await request.json()
    const productId = params.id

    const product =
      await sql`SELECT COALESCE(stock_quantity, 0) AS stock_quantity FROM products WHERE id = ${productId}`
    if (product.length === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    const current = Number(product[0].stock_quantity)
    let next = current
    if (type === "in") next = current + Number(quantity || 0)
    else if (type === "out") next = Math.max(0, current - Number(quantity || 0))
    else next = Number(quantity || 0)

    await sql`UPDATE products SET stock_quantity = ${next}, updated_at = NOW() WHERE id = ${productId}`

    await sql`
      INSERT INTO stock_movements (product_id, type, movement_type, quantity, reason, date, created_at, user_id, created_by)
      VALUES (${productId}, ${type}, ${type}, ${Number(quantity || 0)}, ${reason || "manual adjustment"}, NOW(), NOW(), 'admin', 'admin')
    `

    const [p] = await sql`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        COALESCE(p.stock_quantity, 0) AS current_stock,
        p.price AS selling_price,
        10 AS min_stock_level,
        100 AS max_stock_level,
        COALESCE(p.price * 0.6, p.price) AS cost_price,
        'Default Supplier' AS supplier,
        p.updated_at AS last_restocked,
        COALESCE(res.reserved_stock, 0) AS reserved_stock
      FROM products p
      LEFT JOIN (
        SELECT oi.product_id, SUM(oi.quantity) AS reserved_stock
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('pending','processing')
        GROUP BY oi.product_id
      ) res ON res.product_id = p.id
      WHERE p.id = ${productId}
    `

    const available = Number(p.current_stock) - Number(p.reserved_stock || 0)
    const status =
      Number(p.current_stock) === 0
        ? "out_of_stock"
        : Number(p.current_stock) <= Number(p.min_stock_level)
          ? "low_stock"
          : "in_stock"

    return NextResponse.json({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      current_stock: Number(p.current_stock),
      reserved_stock: Number(p.reserved_stock || 0),
      available_stock: Math.max(0, available),
      reorder_level: Number(p.min_stock_level),
      cost_price: Number(p.cost_price),
      selling_price: Number(p.selling_price),
      supplier: p.supplier,
      last_restocked: p.last_restocked,
      status,
    })
  } catch (error) {
    console.error("Error adjusting stock:", error)
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 })
  }
}
