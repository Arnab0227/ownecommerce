
import { Button } from "@/components/ui/button"
import { ArrowRight, Award, Crown, Users } from 'lucide-react'
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-12 md:py-20 overflow-x-hidden">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-5"></div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-amber-200 to-yellow-300 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full opacity-15 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left px-2 md:px-0">
            <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 border border-amber-200">
              <Crown className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              35+ Years of Crafting Excellence
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
              Timeless Elegance for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600">
                {" "}
                Women & Children
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 leading-relaxed">
              From our heritage boutique to your doorstep. Experience three decades of curated fashion, now available
              online with the same personal touch and premium quality you've trusted for generations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start mb-8 md:mb-12">
              <Link href="/categories/women">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:from-amber-700 hover:via-yellow-700 hover:to-orange-700 text-white px-6 md:px-8 shadow-lg w-full sm:w-auto text-sm md:text-base"
                >
                  Explore Women's Collection
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <Link href="/categories/kids">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 px-6 md:px-8 bg-transparent shadow-lg w-full sm:w-auto text-sm md:text-base"
                >
                  Discover Kids' Fashion
                </Button>
              </Link>
            </div>

            <div className="flex md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-12">
              <div className="text-center">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-amber-600 mr-2" />
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">35+</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 font-medium">Years of Excellence</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-amber-600 mr-2" />
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">10K+</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 font-medium">Satisfied Families</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center md:justify-start mb-2">
                  <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-600 mr-2" />
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">100%</span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 font-medium">Handpicked Quality</p>
              </div>
            </div>
          </div>

          <div className="relative md:block lg:pl-10">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/ethnic.jpg?height=200&width=150"
                    alt="Heritage Women's Fashion"
                    className="w-full h-32 sm:h-48 object-cover rounded-xl sm:rounded-2xl"
                  />
                  <p className="text-center mt-2 sm:mt-4 font-semibold text-sm sm:text-base text-gray-800">Traditional Collection</p>
                  <p className="text-center text-xs sm:text-sm text-amber-600">Since 1989</p>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/happykids.jpg?height=150&width=150"
                    alt="Premium Kids Fashion"
                    className="w-full h-24 sm:h-36 object-cover rounded-xl sm:rounded-2xl"
                  />
                  <p className="text-center mt-2 sm:mt-4 font-semibold text-sm sm:text-base text-gray-800">Happy Kids</p>
                  <p className="text-center text-xs sm:text-sm text-amber-600">Crafted with Love</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 lg:space-y-6 mt-6 sm:mt-12">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/timeless.jpg?height=180&width=150"
                    alt="Elegant Wear"
                    className="w-full h-28 sm:h-44 object-cover rounded-xl sm:rounded-2xl"
                  />
                  <p className="text-center mt-2 sm:mt-4 font-semibold text-sm sm:text-base text-gray-800">Timeless Elegance</p>
                  <p className="text-center text-xs sm:text-sm text-amber-600">Premium Quality</p>
                </div>
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-500 border border-amber-100">
                  <img
                    src="/curated.jpg?height=160&width=150"
                    alt="Curated Collection"
                    className="w-full h-24 sm:h-40 object-cover rounded-xl sm:rounded-2xl"
                  />
                  <p className="text-center mt-2 sm:mt-4 font-semibold text-sm sm:text-base text-gray-800">Curated Selection</p>
                  <p className="text-center text-xs sm:text-sm text-amber-600">Expert Choice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

