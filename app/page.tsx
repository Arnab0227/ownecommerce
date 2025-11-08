import { ProductGrid } from "@/components/product-grid"
import { Hero } from "@/components/hero"
import { FeaturedCategories } from "@/components/featured-categories"
import { WhyChooseUs } from "@/components/why-choose-us"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* small perf hint: mark hero as LCP in its own component if it uses next/image with priority.
          If Hero uses a plain <img>, ensure it has width/height and decoding="async". */}
      <div className="w-full">
        <Hero />
        <FeaturedCategories />
        <main className="container mx-auto px-4 py-8 md:py-12">
          <ProductGrid />
        </main>
        <WhyChooseUs />
      </div>
    </div>
  )
}
