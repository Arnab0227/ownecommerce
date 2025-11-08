export default function FAQPage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-800 mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6 text-gray-700">
        <div>
          <h3 className="font-semibold text-lg">What payment methods do you accept?</h3>
          <p>We accept major cards, UPI, and wallet payments at checkout.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">How long does delivery take?</h3>
          <p>Most orders reach within 3-7 business days based on your location.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">How do I track my order?</h3>
          <p>You’ll receive a tracking link via email/SMS once your order is shipped.</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Can I return an item?</h3>
          <p>Yes, within 7 days if seals are intact. For defects, contact us via WhatsApp or email.</p>
        </div>
      </div>
    </main>
  )
}
