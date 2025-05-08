"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CoffeeOrderForm from "./coffee-order-form"
import PreOrderForm from "./pre-order-form"
import OnTheSpotForm from "./on-the-spot-form"

export default function OrderTabs() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam === 'spot' ? 'pre-order' : 'order-now')

  return (
    <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="order-now" className="data-[state=active]:bg-[#667538] data-[state=active]:text-white">
          Pre-Order
        </TabsTrigger>
        {/* <TabsTrigger value="pre-order" className="data-[state=active]:bg-[#667538] data-[state=active]:text-white">
          On The Spot
        </TabsTrigger> */}
      </TabsList>
      <TabsContent value="order-now" className="mt-4">
        <CoffeeOrderForm />
      </TabsContent>
      <TabsContent value="pre-order" className="mt-4">
        {/* <PreOrderForm /> */}
        <OnTheSpotForm />
      </TabsContent>
    </Tabs>
  )
} 