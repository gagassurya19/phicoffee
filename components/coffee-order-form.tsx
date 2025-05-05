"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Minus, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { PaymentModal } from "./payment-modal"
import dynamic from 'next/dynamic'
import { formatPrice } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

const MapWithNoSSR = dynamic(() => import('@/components/map').then(mod => mod.default), {
  ssr: false,
})

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
  location: z.string().min(3, {
    message: "Please provide your location for delivery.",
  }),
  location_coordinates: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function CoffeeOrderForm() {
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
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const { toast } = useToast()
  const [gpsPermission, setGpsPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      location: "",
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

  useEffect(() => {
    // Check if geolocation is supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setGpsPermission(result.state)
        result.onchange = () => {
          setGpsPermission(result.state)
        }
      })
    }
  }, [])

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
      const newOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setOrderId(newOrderId)

      // Prepare order data
      const orderData = {
        uuid: newOrderId,
        date: new Date().toISOString(),
        name: values.name,
        phone: values.phone,
        notes: values.notes || "",
        location: values.location,
        location_coordinates: values.location_coordinates,
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

  const handleLocationSelect = (location: [number, number]) => {
    setSelectedLocation(location)
    
    // Format coordinates for Google Maps
    const googleMapsUrl = `https://www.google.com/maps/place/${location[0]},${location[1]}`
    
    // Try to get address with retry
    const fetchAddress = async (retries = 3) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location[0]}&lon=${location[1]}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'PhiCoffeeOrder/1.0'
            }
          }
        )
        
        if (!response.ok) throw new Error('Failed to fetch address')
        
        const data = await response.json()
        if (data?.display_name) {
          // Extract relevant address parts
          const address = data.display_name.split(',').slice(0, 3).join(',').trim()
          // Set display address in form but store Google Maps URL in form data
          form.setValue("location", address)
          form.setValue("location_coordinates", googleMapsUrl)
        } else {
          throw new Error('No address found')
        }
      } catch (error) {
        console.error('Error getting address:', error)
        if (retries > 0) {
          setTimeout(() => fetchAddress(retries - 1), 1000)
        } else {
          // Only use coordinates as last resort
          form.setValue("location", "Please enter your delivery address manually")
          form.setValue("location_coordinates", googleMapsUrl)
        }
      }
    }

    fetchAddress()
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      // if (gpsPermission === 'denied') {
      //   // Show instructions to enable GPS in browser settings
      //   toast({
      //     title: "Location Access Required",
      //     description: "Please enable location access in your browser settings to use this feature.",
      //     variant: "default",
      //   })
      //   return
      // }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude]
          setCurrentPosition(location)
          handleLocationSelect(location)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsPermission('denied')
            toast({
              title: "Location Access Denied",
              description: "Please enable location access in your browser settings to use this feature.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Error",
              description: "Could not get your location. Please select manually on the map.",
              variant: "destructive",
            })
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
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
            <FormLabel>Coffee Selections</FormLabel>
            <div className="grid gap-4">
              {coffeeOptions.map((coffee, index) => (
                <div key={coffee.value} className="flex flex-col gap-4 p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Image
                      src={coffee.image}
                      alt={coffee.label}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div>
                      <h3 className="font-medium">{coffee.label}</h3>
                      <p className="text-sm text-gray-500">Rp {formatPrice(coffee.price)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">With Ice</p>
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
                        <Input
                          type="number"
                          min="0"
                          value={coffeeSelections[index].ice.withIce}
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0)
                            updateCoffeeQuantity(index, value - coffeeSelections[index].ice.withIce, 'withIce')
                          }}
                          className="w-16 text-center"
                        />
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

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Without Ice</p>
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
                        <Input
                          type="number"
                          min="0"
                          value={coffeeSelections[index].ice.withoutIce}
                          onChange={(e) => {
                            const value = Math.max(0, parseInt(e.target.value) || 0)
                            updateCoffeeQuantity(index, value - coffeeSelections[index].ice.withoutIce, 'withoutIce')
                          }}
                          className="w-16 text-center"
                        />
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Delivery Location</FormLabel>
              <Button
                type="button"
                variant={gpsPermission === 'granted' ? "outline" : "default"}
                size="sm"
                onClick={handleCurrentLocation}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {/* {gpsPermission === 'granted' ? 'Use Current Location' : 'Please Enable GPS'} */}
                Use Current Location
              </Button>
            </div>
            <div className="h-[300px] rounded-lg overflow-hidden border">
              <MapWithNoSSR
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
                initialPosition={currentPosition || undefined}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Where should we deliver your coffee?" {...field} />
                  </FormControl>
                  <FormDescription>Building name, room number, or specific location</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          <Button type="submit" className="w-full bg-[#667538] hover:bg-[#97c28d]" disabled={isSubmitting || !hasSelectedCoffees()}>
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

