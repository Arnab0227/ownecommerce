import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const customerId = params.id

    await sql`
      UPDATE users 
      SET status = ${status}
      WHERE id = ${customerId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const customerId = params.id
    await sql`UPDATE users SET status = ${status} WHERE id = ${customerId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating customer (PATCH):", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}
