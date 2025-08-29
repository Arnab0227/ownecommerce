"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface InvoiceGeneratorProps {
  orderId: string
  orderStatus: string
}

interface InvoiceItem {
  name: string
  quantity: number
  price: number
  total: number
}

export function InvoiceGenerator({ orderId, orderStatus }: InvoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateInvoice = async () => {
    if (orderStatus !== "delivered") {
      alert("Invoice can only be generated for delivered orders")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/orders/invoice/${orderId}`)
      if (!response.ok) throw new Error("Failed to generate invoice")

      const invoiceData = await response.json()

      // Create and download PDF
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice ${invoiceData.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .customer-details { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total-row { font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>Your Company Name</h2>
            </div>
            
            <div class="invoice-details">
              <div>
                <strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}<br>
                <strong>Order Number:</strong> ${invoiceData.orderNumber}<br>
                <strong>Date:</strong> ${invoiceData.date}
              </div>
              <div>
                <strong>Payment Method:</strong> ${invoiceData.paymentMethod}<br>
                <strong>Status:</strong> ${invoiceData.status}
              </div>
            </div>
            
            <div class="customer-details">
              <h3>Bill To:</h3>
              <strong>${invoiceData.customer.name}</strong><br>
              ${invoiceData.customer.email}<br>
              ${invoiceData.customer.phone}<br>
              ${invoiceData.customer.address}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items
                  .map(
                    (item: InvoiceItem) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price.toFixed(2)}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="3">Total Amount</td>
                  <td>₹${invoiceData.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error("Invoice generation failed:", error)
      alert("Failed to generate invoice")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generateInvoice}
      disabled={orderStatus !== "delivered" || isGenerating}
      variant="outline"
      size="sm"
    >
      {isGenerating ? (
        <>
          <FileText className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Download Invoice
        </>
      )}
    </Button>
  )
}
