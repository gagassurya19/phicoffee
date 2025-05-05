"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CoffeeOrderForm from "./coffee-order-form"
import PreOrderForm from "./pre-order-form"

export default function OrderTabs() {
  const [activeTab, setActiveTab] = useState("order-now")

  return (
    <Tabs defaultValue="order-now" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="order-now" className="data-[state=active]:bg-[#667538] data-[state=active]:text-white">
          Order Now
        </TabsTrigger>
        <TabsTrigger value="pre-order" className="data-[state=active]:bg-[#667538] data-[state=active]:text-white">
          Pre-Order
        </TabsTrigger>
      </TabsList>
      <TabsContent value="order-now" className="mt-4">
        <CoffeeOrderForm />
      </TabsContent>
      <TabsContent value="pre-order" className="mt-4">
        <PreOrderForm />
      </TabsContent>
    </Tabs>
  )
} 