"use server"

import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"
import { formatPrice } from '@/lib/utils'

interface OrderData {
  uuid: string
  date: string
  name: string
  phone: string
  notes: string
  location: string
  invoice: string
  bukti_pembayaran: string
  status: string
  location_coordinates?: string
  coffeeSelections: string
  totalPrice: number
}

export async function submitOrder(data: OrderData) {
  try {
    // 1. Save to Google Sheets
    await saveToSpreadsheet(data)

    // 2. Send Telegram notification
    await sendTelegramNotification(data)

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
    const chatId = "-1002585854596" // Updated supergroup chat ID
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    if (!botToken) {
      throw new Error("Telegram configuration missing")
    }

    // Format the message
    const formatCoffeeSelections = (selections: any) => {
      try {
        let parsed = selections
        if (typeof selections === 'string') {
          try {
            parsed = JSON.parse(selections)
          } catch (e) {
            console.error('Error parsing coffee selections JSON:', e)
            return String(selections)
          }
        }
        
        if (!Array.isArray(parsed)) {
          console.error('Coffee selections is not an array:', parsed)
          return String(selections)
        }
        
        return parsed
          .filter(selection => selection.quantity > 0)
          .map(selection => {
            const withIce = selection.ice?.withIce > 0 ? `with ice: ${selection.ice.withIce}x` : '';
            const withoutIce = selection.ice?.withoutIce > 0 ? `no ice: ${selection.ice.withoutIce}x` : '';
            const iceDetails = [withIce, withoutIce].filter(Boolean).join(' | ');
            return `• ${selection.type}\n  ${iceDetails}`;
          })
          .join('\n\n');
      } catch (error) {
        console.error('Error formatting coffee selections:', error)
        return String(selections)
      }
    }

    const getDeliverySchedule = (orderDate: string) => {
      const date = new Date(orderDate)
      const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const deliveryDate = new Date(date)
      
      // Calculate delivery date based on order day
      if (day === 1 || day === 2) { // Monday-Tuesday
        deliveryDate.setDate(date.getDate() + (3 - day)) // Deliver on Wednesday
      } else if (day === 3 || day === 4) { // Wednesday-Thursday
        deliveryDate.setDate(date.getDate() + (5 - day)) // Deliver on Friday
      } else if (day === 5 || day === 6) { // Friday-Saturday
        deliveryDate.setDate(date.getDate() + (7 - day)) // Deliver on Sunday
      }
      
      return deliveryDate.toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const message = `
🚀 *NEW COFFEE ORDER* 🚀

👤 *Customer*: ${data.name}
☎️ *Phone*: ${data.phone}
📍 *Location*: ${data.location}
${data.location_coordinates ? `🗺 *Map*: ${data.location_coordinates}` : ""}

☕ *Orders*:
${formatCoffeeSelections(data.coffeeSelections)}

💰 *Total Price*: Rp ${formatPrice(data.totalPrice)}
${data.notes ? `📝 *Notes*: ${data.notes}` : ""}

📅 *Delivery Schedule*:
Antar pesanan pada ${getDeliverySchedule(data.date)} Pukul 15:00 WIB

📄 *Invoice*: ${baseUrl}/invoice/${data.uuid}
⏰ *Order Time*: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
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
      console.error('Telegram API error response:', errorData)
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`)
    }

    return true
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
    throw new Error("Failed to send Telegram notification")
  }
}

export async function submitSpotOrder(orderData: any) {
  try {
    const response = await fetch('/api/spot-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error("Failed to save order to spreadsheet")
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error saving to spreadsheet:", error)
    throw new Error("Failed to save order to spreadsheet")
  }
}

