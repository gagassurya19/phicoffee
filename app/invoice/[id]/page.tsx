import { notFound } from 'next/navigation'
import { google } from 'googleapis'
import { formatPrice, getDeliverySchedule, getWeeklySchedule, type ScheduleItem } from '@/lib/utils'
import React from 'react'
import FeedbackForm from '@/components/FeedbackForm'
import ImageModal from '@/components/ImageModal'

interface OrderData {
  id: string
  date: string
  name: string
  phone: string
  notes: string
  location: string
  location_coordinates: string
  PC0: number  // Phista Coffee (no ice)
  PC1: number  // Phista Coffee (with ice)
  PCM0: number // Phicoffee Caramel Macchiato (no ice)
  PCM1: number // Phicoffee Caramel Macchiato (with ice)
  PBS0: number // Phicoffee Brown Sugar (no ice)
  PBS1: number // Phicoffee Brown Sugar (with ice)
  totalPrice: number
  invoice: string
  payment_proof_url: string
  status: string
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
      range: 'NEW!A2:Q', // Updated range to include all columns
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
      PC0: Number(order[5]),  // PC0
      PC1: Number(order[6]),  // PC1
      PCM0: Number(order[7]), // PCM0
      PCM1: Number(order[8]), // PCM1
      PBS0: Number(order[9]), // PBS0
      PBS1: Number(order[10]), // PBS1
      totalPrice: Number(order[11]), // total price
      location: order[12],    // location
      location_coordinates: order[13], // location coordinates
      invoice: order[14],     // invoice url
      payment_proof_url: order[15], // bukti_pembayaran
      status: order[16],      // status
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

function formatCoffeeSelections(order: OrderData): React.ReactElement {
  const selections: React.ReactElement[] = [];
  
  if (order.PC0 > 0) selections.push(
    <li key="PC0">Phista Coffee ({order.PC0} without ice)</li>
  );
  if (order.PC1 > 0) selections.push(
    <li key="PC1">Phista Coffee ({order.PC1} with ice)</li>
  );
  if (order.PCM0 > 0) selections.push(
    <li key="PCM0">Phicoffee Caramel Macchiato ({order.PCM0} without ice)</li>
  );
  if (order.PCM1 > 0) selections.push(
    <li key="PCM1">Phicoffee Caramel Macchiato ({order.PCM1} with ice)</li>
  );
  if (order.PBS0 > 0) selections.push(
    <li key="PBS0">Phicoffee Brown Sugar ({order.PBS0} without ice)</li>
  );
  if (order.PBS1 > 0) selections.push(
    <li key="PBS1">Phicoffee Brown Sugar ({order.PBS1} with ice)</li>
  );
  
  return <ul className="list-disc pl-5 space-y-1">{selections}</ul>;
}

async function getFeedback(orderId: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({version: "v4", auth});
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'FEEDBACK!A:D',
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) return null // Skip header row

    // Find feedback for this order
    const feedback = rows.find((row) => row[1] === orderId)
    if (!feedback) return null

    return {
      timestamp: feedback[0],
      rating: Number(feedback[2]),
      comment: feedback[3],
    }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return null
  }
}

export default async function InvoicePage({
  params,
}: {
  params: { id: string }
}) {
  // Ensure params is properly handled
  const id = params.id
  
  // Fetch data in parallel
  const [order, feedback] = await Promise.all([
    getOrder(id),
    getFeedback(id)
  ])

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-t-2xl shadow-lg overflow-hidden border-b border-gray-100">
          <div className="px-8 py-6 bg-[#667538] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Invoice</h1>
                <p className="mt-1">Order ID: {order.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Date</p>
                <p className="text-lg">{order.date}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-2xl shadow-lg overflow-hidden">
          <div className="px-8 py-8">
            {/* Customer & Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#667538]/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#667538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Name</span>
                    <span className="font-medium text-gray-900">{order.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Phone</span>
                    <span className="font-medium text-gray-900">0{order.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Location</span>
                    <span className="font-medium text-gray-900">{order.location}</span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#667538]/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#667538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-500 block mb-2">Coffee Orders</span>
                    <div className="bg-white rounded-lg p-4">
                      {formatCoffeeSelections(order)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-gray-500">Total Price</span>
                    <span className="text-xl font-bold text-[#667538]">Rp {formatPrice(order.totalPrice)}</span>
                  </div>
                  {order.notes && (
                    <div className="bg-white rounded-lg p-4">
                      <span className="text-gray-500 block mb-1">Notes</span>
                      <p className="text-gray-900">{order.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-green-50 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-green-700 font-medium text-center">FREE ONGKIR AREA TELKOM UNIVERSITY</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-900">Estimasi Pengiriman</span>
                  </div>
                  <p className="text-gray-600">Pesanan akan diantar pada {getDeliverySchedule(parseDate(order.date))} Pukul 11:00 WIB</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-gray-900">Jadwal PO & Delivery Minggu Ini</span>
                  </div>
                  <ul className="space-y-2">
                    {getWeeklySchedule().map((schedule: ScheduleItem, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Order {schedule.orderDays} akan diantar pada hari {schedule.deliveryDay} Pukul 11:00 WIB
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            {order.payment_proof_url && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#667538]/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#667538]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Payment Proof</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="relative w-full h-64">
                    <ImageModal
                      src={order.payment_proof_url}
                      alt="Payment Proof"
                      className="object-contain w-full h-full rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Form */}
            <FeedbackForm orderId={order.id} existingFeedback={feedback} />
          </div>
        </div>
      </div>
    </div>
  )
} 