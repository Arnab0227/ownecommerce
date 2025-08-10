import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Crown, Users } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-5"></div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-amber-200 to-yellow-300 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full opacity-15 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-6 py-3 rounded-full text-sm font-medium mb-6 border border-amber-200">
              <Crown className="h-4 w-4 mr-2" />
              35+ Years of Crafting Excellence
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Timeless Elegance for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600">
                {" "}
                Women & Children
              </span>
            </h1>

            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              From our heritage boutique to your doorstep. Experience three decades of curated fashion, now available
              online with the same personal touch and premium quality you've trusted for generations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link href="/categories/women">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white px-8 shadow-lg"
                >
                  Explore Women's Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/categories/kids">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 px-8 bg-transparent shadow-lg"
                >
                  Discover Kids' Fashion
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start space-x-12">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-6 w-6 text-amber-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">35+</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Years of Excellence</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-amber-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">10K+</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Satisfied Families</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Crown className="h-6 w-6 text-amber-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">100%</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Handpicked Quality</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/placeholder.svg?height=200&width=150"
                    alt="Heritage Women's Fashion"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <p className="text-center mt-4 font-semibold text-gray-800">Heritage Collection</p>
                  <p className="text-center text-sm text-amber-600">Since 1989</p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/placeholder.svg?height=150&width=150"
                    alt="Premium Kids Fashion"
                    className="w-full h-36 object-cover rounded-2xl"
                  />
                  <p className="text-center mt-4 font-semibold text-gray-800">Little Treasures</p>
                  <p className="text-center text-sm text-amber-600">Crafted with Love</p>
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="bg-white rounded-3xl p-6 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/placeholder.svg?height=180&width=150"
                    alt="Elegant Wear"
                    className="w-full h-44 object-cover rounded-2xl"
                  />
                  <p className="text-center mt-4 font-semibold text-gray-800">Timeless Elegance</p>
                  <p className="text-center text-sm text-amber-600">Premium Quality</p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/placeholder.svg?height=160&width=150"
                    alt="Curated Collection"
                    className="w-full h-40 object-cover rounded-2xl"
                  />
                  <p className="text-center mt-4 font-semibold text-gray-800">Curated Selection</p>
                  <p className="text-center text-sm text-amber-600">Expert Choice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
