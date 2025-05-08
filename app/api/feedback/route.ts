import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { orderId, rating, comment } = await request.json()

    // Validate input
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // Prepare the data to be inserted
    const values = [[
      new Date().toISOString(), // Timestamp
      orderId,
      rating,
      comment,
    ]]

    // Append the data to the FEEDBACK sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'FEEDBACK!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
} 