export default function HeritagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                Heritage
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              A journey of 35+ years in crafting timeless fashion and building lasting relationships
            </p>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">The Beginning - 1989</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Golden Threads began as a small boutique with a simple vision: to bring beautiful, quality fashion to
                  families in our community. What started with a handful of carefully selected pieces has grown into a
                  trusted name in premium fashion.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  From day one, we believed that fashion should be more than just clothing - it should be an expression
                  of elegance, comfort, and confidence.
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-8">
                <img
                  src="/the beginning.png"
                  height="800" width="600"
                  alt="Heritage store 1989"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-8">
                <img
                  src="/placeholder.svg"
                  alt="Growing community"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Building Trust - 1990s-2000s</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Through the decades, we've had the privilege of dressing generations of families. Mothers who shopped
                  with us brought their daughters, creating a beautiful cycle of trust and tradition.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our commitment to quality fabrics, expert craftsmanship, and personal service became the foundation of
                  lasting relationships with over 10,000 families.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Digital Journey - 2024</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Today, we're excited to bring our heritage online. This digital platform represents the same values
                  we've upheld for over three decades - quality, trust, and personal care.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Every piece in our online collection is handpicked with the same expertise and attention to detail
                  that has made Golden Threads a household name.
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-8">
                <img
                  src="/placeholder.svg?height=300&width=400"
                  alt="Modern Golden Threads"
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>

          <div className="mt-16 text-center bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 rounded-3xl p-12 border border-amber-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Promise Continues</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              As we step into the digital age, our commitment remains unchanged: to provide you and your family with the
              finest fashion, backed by decades of expertise and the personal touch that has defined Golden Threads
              since 1989.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
