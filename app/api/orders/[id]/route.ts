import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // Get all orders
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Orders!A2:N', // Adjust the range based on your sheet structure
    })

    const rows = response.data.values
    if (!rows) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Find the order with matching ID
    const order = rows.find((row) => row[0] === params.id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Map the order data to match the OrderData interface
    const orderData = {
      id: order[0],
      name: order[1],
      phone: order[2],
      coffee_type: order[3],
      quantity: parseInt(order[4]),
      size: order[5],
      sugar: order[6],
      ice: order[7],
      notes: order[8],
      location: order[9],
      total_price: parseInt(order[10]),
      status: order[11],
      payment_proof_url: order[12],
      created_at: order[13],
    }

    return NextResponse.json(orderData)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
} 