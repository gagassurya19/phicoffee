import CoffeeOrderForm from "@/components/coffee-order-form"
import { Coffee } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#a8d39e]/30 to-white p-4">
      <div className="max-w-md mx-auto pt-4 pb-20">
        <div className="flex items-center justify-center">
          {/* <Coffee className="h-8 w-8 text-[#a8d39e]" /> */}
          <img src="https://media.canva.com/v2/image-resize/format:PNG/height:200/quality:100/uri:ifs%3A%2F%2F%2Fb853ade9-9bab-47aa-8eb8-e59376fb3397/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAABYXZDIQDTAeNsrnrrYYyvdYkCHgvr_bCw_QgKkYsOxF&exp=1746253688&osig=AAAAAAAAAAAAAAAAAAAAAFESXoYpoct-c_TEc7lQwVw9V7HezIeZIaYBwjCLN4rS&signer=media-rpc&x-canva-quality=thumbnail" alt="Logo" className="md:h-40 h-28 md:w-40 w-28" />
          {/* <h1 className="text-2xl font-bold ml-2 text-gray-800">Phi Coffee</h1> */}
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

