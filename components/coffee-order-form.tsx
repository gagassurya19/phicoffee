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

const coffeeOptions = [
  { value: "americano", label: "Americano" },
  { value: "latte", label: "Latte" },
  { value: "cappuccino", label: "Cappuccino" },
  { value: "mocha", label: "Mocha" },
  { value: "espresso", label: "Espresso" },
  { value: "flat-white", label: "Flat White" },
  { value: "caramel-macchiato", label: "Caramel Macchiato" },
]

export default function CoffeeOrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      notes: "",
      location: "",
      size: "medium",
      sugar: "normal",
      ice: "normal",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await submitOrder(values)
      if (result.success) {
        toast({
          title: "Order Submitted!",
          description: "Your coffee order has been received. We'll prepare it right away!",
        })
        form.reset()
      } else {
        toast({
          title: "Something went wrong",
          description: result.error || "Please try again later",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your coffee" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {coffeeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
        />

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
                    <SelectItem value="none">No Sugar</SelectItem>
                    <SelectItem value="less">Less Sugar</SelectItem>
                    <SelectItem value="normal">Normal Sugar</SelectItem>
                    <SelectItem value="extra">Extra Sugar</SelectItem>
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
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="less">Less Ice</SelectItem>
                    <SelectItem value="normal">Normal Ice</SelectItem>
                    <SelectItem value="extra">Extra Ice</SelectItem>
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
  )
}

