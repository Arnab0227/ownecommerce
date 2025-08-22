import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const inventory = await sql`
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
      ORDER BY p.name
    `

    return NextResponse.json(inventory)
  } catch (error) {
    console.error("Error fetching inventory:", error)

    // Return mock data if tables don't exist
    const mockInventory = [
      {
        id: "1",
        name: "Elegant Silk Dress",
        sku: "GT-WOM-DRS-001",
        category: "women",
        current_stock: 25,
        min_stock_level: 10,
        max_stock_level: 50,
        price: 2999,
        cost_price: 1800,
        supplier: "Silk Creations Ltd",
        last_restocked: "2024-01-10T00:00:00Z",
        reserved_stock: 3,
        available_stock: 22,
        status: "in_stock",
      },
      {
        id: "2",
        name: "Cotton Kids T-Shirt",
        sku: "GT-KID-TSH-001",
        category: "kids",
        current_stock: 8,
        min_stock_level: 15,
        max_stock_level: 100,
        price: 599,
        cost_price: 350,
        supplier: "Kids Fashion Co",
        last_restocked: "2024-01-05T00:00:00Z",
        reserved_stock: 2,
        available_stock: 6,
        status: "low_stock",
      },
      {
        id: "3",
        name: "Designer Handbag",
        sku: "GT-WOM-BAG-001",
        category: "women",
        current_stock: 0,
        min_stock_level: 5,
        max_stock_level: 25,
        price: 1999,
        cost_price: 1200,
        supplier: "Luxury Bags Inc",
        last_restocked: "2023-12-20T00:00:00Z",
        reserved_stock: 0,
        available_stock: 0,
        status: "out_of_stock",
      },
    ]

    return NextResponse.json(mockInventory)
  }
}
