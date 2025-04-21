"use server"

import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

type OrderData = {
  name: string
  phone: string
  coffeeType: string
  size: string
  sugar: string
  ice: string
  notes?: string
  location: string
}

export async function submitOrder(data: OrderData) {
  try {
    // 1. Save to Google Sheets
    await saveToSpreadsheet(data)

    // 2. Send Telegram notification
    // await sendTelegramNotification(data)

    return { success: true }
  } catch (error) {
    console.error("Error submitting order:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

async function saveToSpreadsheet(data: OrderData) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/sheet`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to save order to spreadsheet")
    }

    const result = await response.json()

    return true;
      
  } catch (error) {
    console.error("Error saving to spreadsheet:", error)
    throw new Error("Failed to save order to spreadsheet")
  }
}

async function sendTelegramNotification(data: OrderData) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      throw new Error("Telegram configuration missing")
    }

    // Format the message
    const message = `
🆕 *NEW COFFEE ORDER* 🆕

👤 *Customer*: ${data.name}
☎️ *Phone*: ${data.phone}
☕ *Order*: ${data.coffeeType} (${data.size})
🧊 *Ice*: ${data.ice}
🍬 *Sugar*: ${data.sugar}
📍 *Location*: ${data.location}
${data.notes ? `📝 *Notes*: ${data.notes}` : ""}

⏰ *Time*: ${new Date().toLocaleString()}
    `.trim()

    // Send the message
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`)
    }

    return true
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
    throw new Error("Failed to send Telegram notification")
  }
}

