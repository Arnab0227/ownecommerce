export default function SizeGuidePage() {
  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold text-amber-800 mb-4">Size Guide</h1>
      <h2 className="text-xl font-semibold mt-6 mb-2">Women</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-700">
        <li>XS: Bust 30-32 in, Waist 24-26 in</li>
        <li>S: Bust 32-34 in, Waist 26-28 in</li>
        <li>M: Bust 34-36 in, Waist 28-30 in</li>
        <li>L: Bust 36-38 in, Waist 30-32 in</li>
        <li>XL: Bust 38-40 in, Waist 32-34 in</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Kids (Approx.)</h2>
      <ul className="list-disc pl-6 space-y-1 text-gray-700">
        <li>2-3 yrs: Height 92-98 cm</li>
        <li>4-5 yrs: Height 104-110 cm</li>
        <li>6-7 yrs: Height 116-122 cm</li>
        <li>8-9 yrs: Height 128-134 cm</li>
        <li>10-11 yrs: Height 140-146 cm</li>
      </ul>
      <p className="text-gray-600 mt-4">For the best fit, measure your body and compare with the chart above.</p>
    </main>
  )
}
