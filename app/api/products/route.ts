import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Mock data for fallback
const mockProducts = [
  {
    id: "1",
    name: "Elegant Silk Saree",
    description: "Beautiful handwoven silk saree with traditional patterns",
    price: 8999,
    original_price: 12999,
    category: "women",
    stock: 15,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Silk+Saree",
  },
  {
    id: "2",
    name: "Designer Kurti Set",
    description: "Premium cotton kurti with matching dupatta",
    price: 2499,
    original_price: 3499,
    category: "women",
    stock: 25,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kurti+Set",
  },
  {
    id: "3",
    name: "Kids Party Dress",
    description: "Adorable party dress for special occasions",
    price: 1899,
    original_price: 2499,
    category: "kids",
    stock: 20,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kids+Dress",
  },
  {
    id: "4",
    name: "Traditional Lehenga",
    description: "Stunning lehenga for weddings and festivals",
    price: 15999,
    original_price: 19999,
    category: "women",
    stock: 8,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Lehenga",
  },
  {
    id: "5",
    name: "Kids Ethnic Wear",
    description: "Comfortable ethnic wear for kids",
    price: 1299,
    original_price: 1699,
    category: "kids",
    stock: 30,
    imageUrl: "/placeholder.svg?height=400&width=300&text=Kids+Ethnic",
  },
  {
    id: "6",
    name: "Cotton Salwar Suit",
    description: "Comfortable cotton salwar suit for daily wear",
    price: 1999,
    original_price: 2799,
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

      let products
      if (category) {
        products = await sql`
          SELECT 
            id,
            name,
            description,
            price,
            original_price,
            category,
            COALESCE(stock_quantity, 0) as stock,
            image_url as "imageUrl",
            is_featured,
            is_active,
            sku,
            material,
            care_instructions
          FROM products 
          WHERE category = ${category} AND is_active = true
          ORDER BY created_at DESC
        `
      } else {
        products = await sql`
          SELECT 
            id,
            name,
            description,
            price,
            original_price,
            category,
            COALESCE(stock_quantity, 0) as stock,
            image_url as "imageUrl",
            is_featured,
            is_active,
            sku,
            material,
            care_instructions
          FROM products 
          WHERE is_active = true
          ORDER BY created_at DESC
        `
      }

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
