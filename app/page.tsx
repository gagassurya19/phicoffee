import CoffeeOrderForm from "@/components/coffee-order-form"
import { Coffee } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#a8d39e]/30 to-white p-4">
      <div className="max-w-md mx-auto pt-8 pb-20">
        <div className="flex items-center justify-center mb-6">
          <Coffee className="h-8 w-8 text-[#a8d39e]" />
          <h1 className="text-2xl font-bold ml-2 text-gray-800">Phi Coffee</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-[#a8d39e] p-4 text-white">
            <h2 className="text-xl font-semibold text-center">Order Your Coffee</h2>
            <p className="text-center text-white/80 text-sm mt-1">Fresh brews for Telkom University students</p>
          </div>

          <CoffeeOrderForm />
        </div>
      </div>
    </main>
  )
}

