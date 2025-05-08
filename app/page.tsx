import { Coffee } from "lucide-react"
import OrderTabs from "@/components/order-tabs"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#667538]/30 to-white p-4">
      <div className="max-w-md mx-auto pt-4 pb-20">
        <div className="flex items-center justify-center">
          {/* <Coffee className="h-8 w-8 text-[#667538]" /> */}
          <img src="/phicoffee.png" alt="Logo"/>
          {/* <h1 className="text-2xl font-bold ml-2 text-gray-800">Phi Coffee</h1> */}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-[#667538] p-4 text-white">
            <h2 className="text-xl font-semibold text-center">Order Your Coffee</h2>
            <p className="text-center text-white/80 text-sm mt-1">Fresh brews for Telkom University students</p>
          </div>

          <OrderTabs />
        </div>

        <footer className="mt-8 text-[#667538] text-center py-2 text-sm font-semibold">
          <p>Developed by IT PhiCoffee</p>
        </footer>
      </div>
    </main>
  )
}

