import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@supabase/supabase-js'
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { submitOrder } from "@/app/actions"
import { useRouter } from "next/navigation"
import { Camera, Upload, RotateCcw, CameraOff, Camera as CameraIcon, AlertTriangle } from "lucide-react"

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
  const [showCamera, setShowCamera] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraTimeout, setCameraTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      const tracks = streamRef.current.getVideoTracks()
      if (!tracks || tracks.length === 0) {
        setCameraError('Tidak ada video track pada stream. Cek pengaturan privasi kamera di device Anda.')
        console.log('No video track in stream:', streamRef.current)
      } else {
        setCameraError(null)
        videoRef.current.play().then(() => {
          console.log('Video play() success (effect)')
        }).catch(e => {
          console.log('Play error (effect):', e)
        })
      }
    }
  }, [showCamera, streamRef.current])

  useEffect(() => {
    return () => {
      stopCamera()
      if (cameraTimeout) clearTimeout(cameraTimeout)
    }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    setIsCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        console.log('Stream assigned to video:', stream)
        videoRef.current.play().then(() => {
          console.log('Video play() success')
        }).catch(e => {
          console.log('Play error:', e)
        })
      }
      setShowCamera(true)
      // Fallback: jika 5 detik tidak ready, tampilkan error
      const timeout = setTimeout(() => {
        if (!isCameraReady) {
          setCameraError('Kamera tidak dapat menampilkan gambar. Coba refresh browser atau cek izin kamera.')
        }
      }, 5000)
      setCameraTimeout(timeout)
    } catch (error: any) {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan di browser Anda.")
      toast({
        title: "Error",
        description: error.message || "Could not access camera. Please check your permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
    setIsCameraReady(false)
  }

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)
    stopCamera()
    await startCamera()
  }

  const capturePhoto = () => {
    if (videoRef.current && isCameraReady) {
      const canvas = document.createElement('canvas')
      const video = videoRef.current
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Draw the current frame
        ctx.drawImage(video, 0, 0)
        
        // Convert to blob with high quality
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a file with timestamp
            const file = new File([blob], `payment-proof-${Date.now()}.jpg`, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            
            // Check file size
            if (file.size > 1024 * 1024) {
              toast({
                title: "Warning",
                description: "Photo is too large. Please try again with better lighting.",
                variant: "destructive",
              })
              return
            }
            
            setPaymentProof(file)
            const url = URL.createObjectURL(blob)
            setPreviewUrl(url)
            stopCamera()
          }
        }, 'image/jpeg', 0.95) // Increased quality to 0.95
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please upload an image file (JPEG, PNG, HEIC)",
          variant: "destructive",
        })
        return
      }

      // Check file size (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 1MB",
          variant: "destructive",
        })
        return
      }

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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        stopCamera()
      }
      onClose()
    }}>
      <DialogContent className="sm:max-w-[400px] p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Total: Rp {totalAmount.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Menerima pembayaran apapun dengan <span className="font-bold">QRIS</span></p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/qris/qris.jpeg"
              alt="QRIS Payment"
              width={250}
              height={180}
              className="rounded-lg"
            />
          </div>

          <div className={`relative w-full max-w-xs mx-auto aspect-[4/3] rounded-lg overflow-hidden bg-black border border-gray-200 ${!showCamera ? 'hidden' : ''}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
              style={{ background: '#000' }}
              onLoadedMetadata={() => {
                console.log('Video metadata loaded')
                setIsCameraReady(true)
                if (cameraTimeout) clearTimeout(cameraTimeout)
              }}
            />
            {!isCameraReady && showCamera && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                <CameraOff className="h-8 w-8 text-white animate-pulse mb-2" />
                <span className="text-white text-xs">Menginisialisasi kamera...</span>
              </div>
            )}
            {cameraError && showCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <AlertTriangle className="h-8 w-8 text-yellow-400 mb-2" />
                <span className="text-white text-xs text-center">{cameraError}</span>
              </div>
            )}
          </div>

          {showCamera ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 px-2"
                  size="sm"
                  disabled={!isCameraReady || !!cameraError}
                >
                  <CameraIcon className="h-4 w-4 mr-1" />
                  Ambil Foto
                </Button>
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  className="flex-1 px-2"
                  size="sm"
                  disabled={!isCameraReady || !!cameraError}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Ganti Kamera
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex-1 px-2"
                  size="sm"
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="flex items-center gap-2 justify-center"
                  size="sm"
                >
                  <Camera className="h-4 w-4" />
                  Ambil Foto
                </Button>
                <div className="relative">
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/heic,image/heif"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 justify-center"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    <Upload className="h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Ukuran maks: 1MB. Format: JPEG, PNG, HEIC (iPhone)</p>
            </div>
          )}

          {previewUrl && (
            <div className="mt-2">
              <Label>Bukti Pembayaran Preview</Label>
              <div className="relative w-full h-40 mt-2 rounded-lg overflow-hidden border mx-auto">
                <Image
                  src={previewUrl}
                  alt="Payment Proof Preview"
                  fill
                  className="object-contain"
                  sizes="(max-width: 400px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !paymentProof}
            className="w-full mt-2"
            size="sm"
          >
            {isSubmitting ? "Submitting..." : "Submit Order"}
          </Button>

          {isSubmitting && (
            <div className="text-center text-gray-600 text-xs">
              Mohon tunggu, pesanan Anda sedang diproses...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 