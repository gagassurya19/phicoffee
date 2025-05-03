"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { submitOrder } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { PaymentModal } from "./payment-modal"
import { createClient } from '@supabase/supabase-js'

const coffeeOptions = [
  { value: "phista coffee", label: "Phista Coffee", price: 18000, image: "/phista_coffee.png" },
  { value: "Phicoffee Caramel Macchiato", label: "Phicoffee Caramel Macchiato", price: 20000, image: "/caramel.png" },
  { value: "Phicoffee Brown Sugar", label: "Phicoffee Brown Sugar", price: 20000, image: "/brown_sugar.png" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  coffeeType: z.string({
    required_error: "Please select a coffee type.",
  }),
  quantity: z.number().min(1, {
    message: "Quantity must be at least 1.",
  }),
  size: z.enum(["small", "medium", "large"], {
    required_error: "Please select a size.",
  }),
  sugar: z.enum(["none", "less", "normal", "extra"], {
    required_error: "Please select sugar preference.",
  }),
  ice: z.enum(["hot", "less", "normal", "extra"], {
    required_error: "Please select ice preference.",
  }),
  notes: z.string().optional(),
  location: z.string().min(3, {
    message: "Please provide your location for delivery.",
  }),
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CoffeeOrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCoffee, setSelectedCoffee] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [orderId, setOrderId] = useState<string>("")
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      location: "",
      quantity: 1,
      size: "medium",
      sugar: "normal",
      ice: "normal",
    },
  })

  const selectedCoffeeDetails = coffeeOptions.find(coffee => coffee.value === selectedCoffee)
  const totalPrice = selectedCoffeeDetails ? selectedCoffeeDetails.price * quantity : 0

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const selectedCoffeeDetails = coffeeOptions.find(coffee => coffee.value === values.coffeeType)
      const totalPrice = selectedCoffeeDetails ? selectedCoffeeDetails.price * values.quantity : 0

      // Generate a unique order ID
      const newOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setOrderId(newOrderId)

      // Prepare order data according to sheet structure
      const orderData = {
        uuid: newOrderId,
        date: new Date().toISOString(),
        name: values.name,
        phone: values.phone,
        notes: values.notes || "",
        location: values.location,
        size: values.size,
        sugar: values.sugar,
        ice: values.ice,
        bukti_pembayaran: "", // Will be updated after payment
        status: "pending_payment"
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
    // Reset form only if order was successfully submitted
    if (orderData?.status === 'pending_verification') {
      form.reset()
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

          <FormField
            control={form.control}
            name="coffeeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coffee Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedCoffee(value)
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your coffee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {coffeeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Image 
                            src={option.image} 
                            alt={option.label} 
                            width={40} 
                            height={40} 
                            className="rounded-full"
                          />
                          <div>
                            <span>{option.label}</span>
                            <span className="text-sm text-gray-500 ml-2">Rp {option.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    {...field} 
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      field.onChange(value)
                      setQuantity(value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-2">
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="small" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Small</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="medium" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Medium</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-1 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="large" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">Large</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sugar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sugar</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sugar level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* <SelectItem value="none">No Sugar</SelectItem>
                      <SelectItem value="less">Less Sugar</SelectItem> */}
                      <SelectItem value="normal">Normal Sugar</SelectItem>
                      {/* <SelectItem value="extra">Extra Sugar</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ice / Temperature</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ice level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="less">Less Ice</SelectItem> */}
                      <SelectItem value="normal">Normal Ice</SelectItem>
                      <SelectItem value="extra">No Ice</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Location</FormLabel>
                <FormControl>
                  <Input placeholder="Where should we deliver your coffee?" {...field} />
                </FormControl>
                <FormDescription>Building name, room number, or specific location</FormDescription>
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

          {selectedCoffee && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="flex justify-between items-center">
                <span>Total Price:</span>
                <span className="font-bold">Rp {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-[#a8d39e] hover:bg-[#97c28d]" disabled={isSubmitting}>
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
          totalAmount={totalPrice}
          orderId={orderId}
          orderData={orderData}
        />
      )}
    </>
  )
}

