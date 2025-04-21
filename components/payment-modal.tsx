import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@supabase/supabase-js'
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { submitOrder } from "@/app/actions"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  orderId: string
  orderData: {
    uuid: string
    date: string
    name: string
    phone: string
    notes: string
    location: string
    size: string
    sugar: string
    ice: string
    invoice: string
    bukti_pembayaran: string
    status: string
  }
}

export function PaymentModal({ isOpen, onClose, totalAmount, orderId, orderData }: PaymentModalProps) {
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPaymentProof(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmitOrder = async () => {
    if (!paymentProof) {
      toast({
        title: "Error",
        description: "Please upload payment proof first",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Upload image to Supabase
      const fileExt = paymentProof.name.split('.').pop()
      const fileName = `${orderId}-${Date.now()}.${fileExt}`
      const filePath = `payment-proofs/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, paymentProof, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading payment proof:', uploadError)
        if (uploadError.message.includes('row-level security')) {
          throw new Error('Storage access denied. Please check your Supabase configuration.')
        }
        throw uploadError
      }

      // Get public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      // Update order data with payment proof and status
      const updatedOrderData = {
        ...orderData,
        bukti_pembayaran: publicUrl,
        status: 'pending_verification'
      }

      const result = await submitOrder(updatedOrderData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit order')
      }

      toast({
        title: "Success",
        description: "Order submitted successfully!",
      })

      // redirect to invoice page
      router.push(`/invoice/${orderId}`)
    } catch (error: any) {
      console.error('Error in handleSubmitOrder:', error)
      let errorMessage = "Failed to submit order. Please try again."
      
      if (error.message.includes('row-level security')) {
        errorMessage = "Access denied. Please check your Supabase configuration."
      } else if (error.message.includes('storage')) {
        errorMessage = "Failed to upload payment proof. Please try again."
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Total: Rp {totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Hanya menerima pembayaran dengan <span className="font-bold">GOPAY</span></p>
          </div>
          
          <div className="flex justify-center">
            <Image
              src="/qris/gopay.png"
              alt="QRIS Payment"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-proof">Upload Payment Proof</Label>
            <Input
              id="payment-proof"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </div>

          {previewUrl && (
            <div className="mt-2">
              <Label>Payment Proof Preview</Label>
              <div className="relative w-full h-48 mt-2">
                <Image
                  src={previewUrl}
                  alt="Payment Proof Preview"
                  fill
                  className="object-contain rounded-lg border"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !paymentProof}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>

          {isSubmitting && (
            <div className="text-center text-gray-600">
              Please wait while we process your order...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 