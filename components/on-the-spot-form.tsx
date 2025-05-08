"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { PaymentModal } from "./payment-modal"
import { formatPrice } from "@/lib/utils"

interface CoffeeSelection {
  type: string;
  quantity: number;
  ice: {
    withIce: number;
    withoutIce: number;
  };
}

const coffeeOptions = [
  { value: "phista coffee", label: "Phista Coffee", price: 20000, image: "/phista_coffee.png" },
  { value: "Phicoffee Caramel Macchiato", label: "Phicoffee Caramel Macchiato", price: 20000, image: "/caramel.png" },
  { value: "Phicoffee Brown Sugar", label: "Phicoffee Brown Sugar", price: 18000, image: "/brown_sugar.png" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  coffeeSelections: z.array(z.object({
    type: z.string({
      required_error: "Please select a coffee type.",
    }),
    quantity: z.number().min(0),
    ice: z.object({
      withIce: z.number().min(0),
      withoutIce: z.number().min(0),
    }),
  })).refine(
    (arr) => arr.some(item => item.quantity > 0),
    { message: "Please select at least one coffee (qty > 0)." }
  ),
  notes: z.string().optional(),
  pickupTime: z.string({
    required_error: "Please select a pickup time.",
  }),
})

type FormData = z.infer<typeof formSchema>

export default function OnTheSpotForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coffeeSelections, setCoffeeSelections] = useState<CoffeeSelection[]>(
    coffeeOptions.map(coffee => ({ 
      type: coffee.value, 
      quantity: 0,
      ice: {
        withIce: 0,
        withoutIce: 0
      }
    }))
  )
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [orderId, setOrderId] = useState<string>("")
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      pickupTime: "",
      coffeeSelections: coffeeOptions.map(coffee => ({ 
        type: coffee.value, 
        quantity: 0,
        ice: {
          withIce: 0,
          withoutIce: 0
        }
      })),
    },
  })

  const updateCoffeeQuantity = (index: number, change: number, iceType: 'withIce' | 'withoutIce') => {
    const newSelections = [...coffeeSelections]
    const newQuantity = Math.max(0, newSelections[index].ice[iceType] + change)
    newSelections[index] = { 
      ...newSelections[index], 
      ice: {
        ...newSelections[index].ice,
        [iceType]: newQuantity
      },
      quantity: newSelections[index].ice.withIce + newSelections[index].ice.withoutIce + change
    }
    setCoffeeSelections(newSelections)
    form.setValue("coffeeSelections", newSelections)
  }

  const calculateTotalPrice = () => {
    return coffeeSelections.reduce((total, selection) => {
      const coffee = coffeeOptions.find(opt => opt.value === selection.type)
      return total + (coffee ? coffee.price * selection.quantity : 0)
    }, 0)
  }

  const hasSelectedCoffees = () => {
    return coffeeSelections.some(selection => selection.quantity > 0)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!hasSelectedCoffees()) {
      toast({
        title: "Error",
        description: "Please select at least one coffee.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const totalPrice = calculateTotalPrice()

      // Generate a unique order ID
      const newOrderId = `SPOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setOrderId(newOrderId)

      // Prepare order data
      const orderData = {
        uuid: newOrderId,
        date: new Date().toISOString(),
        name: values.name,
        phone: values.phone,
        notes: values.notes || "",
        pickupTime: values.pickupTime,
        coffeeSelections: values.coffeeSelections.filter(selection => selection.quantity > 0),
        bukti_pembayaran: "",
        status: "pending_payment",
        totalPrice: totalPrice
      }

      setOrderData(orderData)
      setShowPaymentModal(true)
    } catch (error) {
      console.error('Error in onSubmit:', error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModalClose = () => {
    setShowPaymentModal(false)
    if (orderData?.status === 'pending_verification') {
      form.reset()
      setCoffeeSelections(coffeeOptions.map(coffee => ({ 
        type: coffee.value, 
        quantity: 0,
        ice: {
          withIce: 0,
          withoutIce: 0
        }
      })))
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Your phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <h3 className="font-semibold">Select Your Coffee</h3>
            {coffeeOptions.map((coffee, index) => (
              <div key={coffee.value} className="p-4 border rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <Image 
                    src={coffee.image} 
                    alt={coffee.label} 
                    width={60} 
                    height={60} 
                    className="rounded-lg"
                  />
                  <div>
                    <h4 className="font-medium">{coffee.label}</h4>
                    <p className="text-sm text-gray-500">Rp {coffee.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm mb-2">Without Ice</p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCoffeeQuantity(index, -1, 'withoutIce')}
                        disabled={coffeeSelections[index].ice.withoutIce === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{coffeeSelections[index].ice.withoutIce}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCoffeeQuantity(index, 1, 'withoutIce')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm mb-2">With Ice</p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCoffeeQuantity(index, -1, 'withIce')}
                        disabled={coffeeSelections[index].ice.withIce === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{coffeeSelections[index].ice.withIce}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateCoffeeQuantity(index, 1, 'withIce')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <FormField
            control={form.control}
            name="pickupTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup Time</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    min="09:00" 
                    max="21:00" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>When would you like to pick up your order? (Between 9:00 AM - 9:00 PM)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any special requests or instructions?" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasSelectedCoffees() && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              {coffeeSelections
                .filter(selection => selection.quantity > 0)
                .map((selection, index) => {
                  const coffee = coffeeOptions.find(opt => opt.value === selection.type)
                  return coffee ? (
                    <div key={index} className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{coffee.label}</span>
                        <span>Rp {formatPrice(coffee.price * selection.quantity)}</span>
                      </div>
                      <div className="text-sm text-gray-600 pl-4">
                        {selection.ice.withIce > 0 && (
                          <div>With Ice: {selection.ice.withIce}</div>
                        )}
                        {selection.ice.withoutIce > 0 && (
                          <div>Without Ice: {selection.ice.withoutIce}</div>
                        )}
                      </div>
                    </div>
                  ) : null
                })}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="font-semibold">Total Price:</span>
                <span className="font-bold">Rp {formatPrice(calculateTotalPrice())}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-[#667538] hover:bg-[#97c28d]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </form>
      </Form>

      {showPaymentModal && orderData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleModalClose}
          totalAmount={calculateTotalPrice()}
          orderId={orderId}
          orderData={orderData}
        />
      )}
    </>
  )
} 