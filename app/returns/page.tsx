export default function ReturnsPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-800 mb-4">Returns & Exchanges</h1>
      <p className="text-gray-700 mb-4">
        We have a 7-day return policy if seals are intact. In case of manufacturing defects, we’ll assist with a
        replacement or refund.
      </p>
      <div className="space-y-3 text-gray-700">
        <p>Contact us on WhatsApp or email (see Contact Us page) with your order ID and issue details for returns.</p>
        <ul className="list-disc pl-6">
          <li>Items must be unused, with original tags and packaging</li>
          <li>Quality check will be done once the item is received</li>
          <li>Refunds are processed to the original payment method</li>
        </ul>
      </div>
    </main>
  )
}
