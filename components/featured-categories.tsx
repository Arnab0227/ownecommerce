import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Crown } from "lucide-react"

export function FeaturedCategories() {
  const categories = [
    {
      title: "Women's Heritage Collection",
      description: "Timeless elegance crafted with 35+ years of expertise",
      image: "/placeholder.svg?height=300&width=400",
      href: "/categories/women/dresses",
      color: "from-amber-400 to-yellow-500",
    },
    {
      title: "Traditional Ethnic Wear",
      description: "Authentic Indian craftsmanship meets modern comfort",
      image: "/placeholder.svg?height=300&width=400",
      href: "/categories/women/ethnic",
      color: "from-orange-400 to-red-500",
    },
    {
      title: "Children's Premium Line",
      description: "Gentle fabrics and playful designs for little treasures",
      image: "/placeholder.svg?height=300&width=400",
      href: "/categories/kids",
      color: "from-yellow-400 to-orange-500",
    },
    {
      title: "Curated Casual Wear",
      description: "Effortless style for everyday elegance",
      image: "/placeholder.svg?height=300&width=400",
      href: "/categories/women/casual",
      color: "from-amber-500 to-yellow-600",
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-amber-600 mr-3" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Heritage Collections</h2>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our carefully curated collections, each piece selected with the wisdom of three decades in fashion
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={category.href}>
              <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-amber-200 bg-gradient-to-b from-white to-amber-50/30">
                <div className="relative">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.title}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-20 group-hover:opacity-30 transition-opacity duration-500`}
                  ></div>
                  <div className="absolute top-4 right-4">
                    <Crown className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{category.description}</p>
                  <div className="flex items-center text-amber-600 font-medium group-hover:text-amber-700">
                    <span>Explore Collection</span>
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
