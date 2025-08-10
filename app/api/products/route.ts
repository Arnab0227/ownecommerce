import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Mock data for fallback
const mockProducts = [
  {
    id: "1",
    name: "Elegant Silk Saree",
    description: "Beautiful handwoven silk saree with traditional patterns",
    price: 8999,
    originalPrice: 12999,
    category: "women",
    stock: 15,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Silk+Saree",
  },
  {
    id: "2",
    name: "Designer Kurti Set",
    description: "Premium cotton kurti with matching dupatta",
    price: 2499,
    originalPrice: 3499,
    category: "women",
    stock: 25,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kurti+Set",
  },
  {
    id: "3",
    name: "Kids Party Dress",
    description: "Adorable party dress for special occasions",
    price: 1899,
    originalPrice: 2499,
    category: "kids",
    stock: 20,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kids+Dress",
  },
  {
    id: "4",
    name: "Traditional Lehenga",
    description: "Stunning lehenga for weddings and festivals",
    price: 15999,
    originalPrice: 19999,
    category: "women",
    stock: 8,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Lehenga",
  },
  {
    id: "5",
    name: "Kids Ethnic Wear",
    description: "Comfortable ethnic wear for kids",
    price: 1299,
    originalPrice: 1699,
    category: "kids",
    stock: 30,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kids+Ethnic",
  },
  {
    id: "6",
    name: "Cotton Salwar Suit",
    description: "Comfortable cotton salwar suit for daily wear",
    price: 1999,
    originalPrice: 2799,
    category: "women",
    stock: 18,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Salwar+Suit",
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL)

      // First, check what columns exist in the products table
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
      `

      const availableColumns = columnCheck.map((row) => row.column_name)
      console.log("Available columns:", availableColumns)

      // Build the query based on available columns
      let query
      if (category) {
        if (availableColumns.includes("stock_quantity")) {
          // Use stock_quantity and calculate originalPrice from price
          query = sql`
            SELECT 
              id,
              name,
              description,
              price,
              (price * 1.3)::integer as "originalPrice",
              category,
              stock_quantity as stock,
              image_url as "imageUrl"
            FROM products 
            WHERE category = ${category}
            ORDER BY created_at DESC
          `
        } else {
          // Use stock column
          query = sql`
            SELECT 
              id,
              name,
              description,
              price,
              (price * 1.3)::integer as "originalPrice",
              category,
              stock,
              image_url as "imageUrl"
            FROM products 
            WHERE category = ${category}
            ORDER BY created_at DESC
          `
        }
      } else {
        if (availableColumns.includes("stock_quantity")) {
          // Use stock_quantity and calculate originalPrice from price
          query = sql`
            SELECT 
              id,
              name,
              description,
              price,
              (price * 1.3)::integer as "originalPrice",
              category,
              stock_quantity as stock,
              image_url as "imageUrl"
            FROM products 
            ORDER BY created_at DESC
          `
        } else {
          // Use stock column
          query = sql`
            SELECT 
              id,
              name,
              description,
              price,
              (price * 1.3)::integer as "originalPrice",
              category,
              stock,
              image_url as "imageUrl"
            FROM products 
            ORDER BY created_at DESC
          `
        }
      }

      const products = await query

      return NextResponse.json(products)
    } else {
      console.log("No DATABASE_URL found, returning mock data")
      const filteredProducts = category ? mockProducts.filter((product) => product.category === category) : mockProducts
      return NextResponse.json(filteredProducts)
    }
  } catch (error) {
    console.error("Database error:", error)
    console.log("Falling back to mock data")
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const filteredProducts = category ? mockProducts.filter((product) => product.category === category) : mockProducts
    return NextResponse.json(filteredProducts)
  }
}
