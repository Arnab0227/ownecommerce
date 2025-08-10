import { ProductGrid } from "@/components/product-grid"
import { Hero } from "@/components/hero"
import { FeaturedCategories } from "@/components/featured-categories"
import { WhyChooseUs } from "@/components/why-choose-us"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedCategories />
      <main className="container mx-auto px-4 py-12">
        <ProductGrid />
      </main>
      <WhyChooseUs />
    </div>
  )
}
