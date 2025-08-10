import { Shield, Truck, RotateCcw, Crown, Award, Headphones } from "lucide-react"

export function WhyChooseUs() {
  const features = [
    {
      icon: Crown,
      title: "35+ Years of Heritage",
      description: "Three decades of trust, quality, and fashion expertise",
    },
    {
      icon: Shield,
      title: "Premium Quality Promise",
      description: "Only the finest fabrics and materials, tested by time",
    },
    {
      icon: Award,
      title: "Handpicked Excellence",
      description: "Every piece curated by our expert fashion team",
    },
    {
      icon: Truck,
      title: "Careful Delivery",
      description: "Your treasures delivered with the same care we'd give family",
    },
    {
      icon: RotateCcw,
      title: "Heritage Guarantee",
      description: "Easy exchanges backed by our decades of service",
    },
    {
      icon: Headphones,
      title: "Personal Touch",
      description: "The same personal service you've known for generations",
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-amber-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">The Golden Threads Promise</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            From our heritage boutique to your home - the same commitment to excellence that has served families for
            over three decades
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 rounded-full mb-4 sm:mb-6 group-hover:from-amber-200 group-hover:via-yellow-200 group-hover:to-orange-200 transition-all duration-300 shadow-lg">
                <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 rounded-2xl p-6 sm:p-8 border border-amber-200">
            <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">From 1989 to Today</h3>
            <p className="text-gray-700 max-w-2xl mx-auto text-sm sm:text-base">
              What started as a small boutique serving local families has grown into a trusted name in fashion. Now, we
              bring the same personal touch and quality commitment to your digital doorstep.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
