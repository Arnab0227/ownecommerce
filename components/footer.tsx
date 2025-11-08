import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-amber-900 to-orange-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Suktara</h3>
            <p className="text-amber-100 mb-4">
              Celebrating 35+ years of fashion excellence. From our heritage boutique to your doorstep, we bring you the
              finest collection of women's and children's garments.
            </p>
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-xs">FB</span>
              </div>
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-xs">IG</span>
              </div>
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-xs">TW</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-amber-100 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-amber-100 hover:text-white">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-amber-100 hover:text-white">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-amber-100 hover:text-white">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-amber-100 hover:text-white">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/categories/women" className="text-amber-100 hover:text-white">
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link href="/categories/kids" className="text-amber-100 hover:text-white">
                  Kids Collection
                </Link>
              </li>
              <li>
                <Link href="/heritage" className="text-amber-100 hover:text-white">
                  Our Heritage
                </Link>
              </li>
              <li>
                <Link href="/gift-cards" className="text-amber-100 hover:text-white">
                  Gift Cards
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-amber-800 mt-8 pt-8 text-center">
          <p className="text-amber-100">
            © 2024 Suktara. All rights reserved. | Crafted with love for fashion enthusiasts.
          </p>
        </div>
      </div>
    </footer>
  )
}
