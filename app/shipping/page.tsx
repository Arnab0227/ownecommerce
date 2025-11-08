export default function ShippingInfoPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-800 mb-4">Shipping Information</h1>
      <p className="text-gray-700 mb-6">
        We ship across India with trusted partners. Orders are typically processed within 1-2 business days.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li>Standard shipping: 3-7 business days depending on destination</li>
        <li>Tracking details will be shared via email/SMS once shipped</li>
        <li>Shipping fees are shown at checkout</li>
      </ul>
    </main>
  )
}
