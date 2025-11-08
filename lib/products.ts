import { neon } from "@neondatabase/serverless"
import type { Product } from "@/hooks/use-cart"

const sql = neon(process.env.DATABASE_URL!)

export async function getProductById(id: string | number): Promise<Product | null> {
  try {
    const products = await sql`
      SELECT * FROM products WHERE id = ${id}
    `

    if (products.length === 0) {
      return null
    }

    const product = products[0] as any
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      imageUrl: product.image_url,
      category: product.category,
      rating: product.rating || 0,
      stock: product.stock_quantity || product.stock || 0,
      model_no: product.model_no,
    } as Product
  } catch (error) {
    console.error("[v0] Error fetching product:", error)
    return null
  }
}
