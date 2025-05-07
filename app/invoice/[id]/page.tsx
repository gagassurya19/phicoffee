import { notFound } from 'next/navigation'
import { google } from 'googleapis'
import { formatPrice, getDeliverySchedule, getWeeklySchedule, type ScheduleItem } from '@/lib/utils'

interface OrderData {
  id: string
  date: string
  name: string
  phone: string
  notes: string
  location: string
  coffeeSelections: string
  invoice: string
  payment_proof_url: string
  status: string
  totalPrice: number
}

async function getOrder(id: string): Promise<OrderData | null> {
  try {
    // auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({version: "v4", auth});

    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // Get all orders
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:L', // Get all rows from A2 to K (excluding header)
    })

    const rows = response.data.values
    if (!rows) {
      return null
    }

    // Find the order with matching ID
    const order = rows.find((row) => row[0] === id)
    if (!order) {
      return null
    }
    
    // Map the order data to match the OrderData interface
    const orderData = {
      id: order[0],           // uuid
      date: order[1],         // date
      name: order[2],         // name
      phone: order[3],        // phone
      notes: order[4],        // notes
      coffeeSelections: order[5], // coffee selections
      totalPrice: order[6],   // total price
      location: order[7],     // location
      invoice: order[9],      // invoice url
      payment_proof_url: order[10], // bukti_pembayaran
      status: order[11],       // status
    }

    return orderData
  } catch (error) {
    console.error('Error fetching order:', error)
    return null
  }
}

function parseDate(dateStr: string): string {
  // Parse date in format "6/5/2025, 23.38.42"
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split('.');
  
  // Create date in YYYY-MM-DDTHH:mm:ss format
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

export default async function InvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const order = await getOrder(params.id)

  console.log("ORDER",order)

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
            <div className="text-sm text-gray-500">
              Order ID: {order.id}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.name}</p>
                <p><span className="font-medium">Phone:</span> 0{order.phone}</p>
                <p><span className="font-medium">Location:</span> {order.location}</p>
                <p><span className="font-medium">Date:</span> {order.date}</p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Coffee Orders:</span> {order.coffeeSelections}</p>
                <p><span className="font-medium">Total Price:</span> Rp {formatPrice(order.totalPrice)}</p>
                {order.notes && (
                  <p><span className="font-medium">Notes:</span> {order.notes}</p>
                )}
                <p><span className="font-medium">Status:</span> {order.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
            <div className="space-y-4">
              <p className="text-green-700 font-medium">FREE ONGKIR AREA TELKOM UNIVERSITY</p>
              
              <div className="space-y-2">
                <p className="font-medium">Estimasi Pengiriman:</p>
                <p>Pesanan akan diantar pada {getDeliverySchedule(parseDate(order.date))} Pukul 11:00 WIB</p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Jadwal PO & Delivery Minggu Ini:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {getWeeklySchedule().map((schedule: ScheduleItem, index: number) => (
                    <li key={index}>
                      Order {schedule.orderDays} akan diantar pada hari {schedule.deliveryDay} Pukul 11:00 WIB
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {order.payment_proof_url && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Proof</h2>
              <div className="relative w-full h-64">
                <img
                  src={order.payment_proof_url}
                  alt="Payment Proof"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}

          {/* <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Invoice Number</span>
              <span className="text-2xl font-bold text-gray-900">
                {order.invoice}
              </span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
} 