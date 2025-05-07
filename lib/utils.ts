import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getDeliverySchedule(orderDate: string) {
  const date = new Date(orderDate)
  const day = date.getDay() // 0 = Sunday, 1 = Monday, etc.
  const deliveryDate = new Date(date)
  
  // Calculate delivery date based on order day
  if (day === 0) { // Sunday
    deliveryDate.setDate(date.getDate() + 3) // Deliver on Wednesday
  } else if (day === 1 || day === 2) { // Monday-Tuesday
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

export interface ScheduleItem {
  orderDays: string;
  deliveryDay: string;
}

export function getWeeklySchedule(): ScheduleItem[] {
  const today = new Date()
  const schedule: ScheduleItem[] = []
  
  // Get Sunday of current week
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  
  // Group days into pairs
  const dayGroups = [
    { days: [0, 1, 2], name: 'Minggu-Senin-Selasa' },  // Sunday-Monday-Tuesday
    { days: [3, 4], name: 'Rabu-Kamis' },              // Wednesday-Thursday
    { days: [5, 6], name: 'Jumat-Sabtu' }              // Friday-Saturday
  ]
  
  // Generate schedule for each group
  dayGroups.forEach(group => {
    let firstDay = new Date(sunday)
    let middleDay = new Date(sunday)
    let lastDay = new Date(sunday)
    let deliveryDate = new Date(sunday)
    
    if (group.days[0] === 0) { // Sunday-Monday-Tuesday
      firstDay = new Date(sunday) // Sunday
      middleDay.setDate(sunday.getDate() + 1) // Monday
      lastDay.setDate(sunday.getDate() + 2) // Tuesday
      deliveryDate = new Date(lastDay)
      deliveryDate.setDate(lastDay.getDate() + 1) // Wednesday (7 Mei)
    } else if (group.days[0] === 3) { // Wednesday-Thursday
      firstDay.setDate(sunday.getDate() + 3) // Wednesday
      lastDay.setDate(sunday.getDate() + 4) // Thursday
      deliveryDate = new Date(lastDay)
      deliveryDate.setDate(lastDay.getDate() + 1) // Friday (9 Mei)
    } else { // Friday-Saturday
      firstDay.setDate(sunday.getDate() + 5) // Friday
      lastDay.setDate(sunday.getDate() + 6) // Saturday
      deliveryDate = new Date(lastDay)
      deliveryDate.setDate(lastDay.getDate() + 1) // Sunday (11 Mei)
    }
    
    // Format the date range
    const dateRange = group.days[0] === 0 
      ? `${firstDay.getDate()}-${middleDay.getDate()}-${lastDay.getDate()}`  // For Sunday-Monday-Tuesday
      : `${firstDay.getDate()}-${lastDay.getDate()}`                         // For other groups
    
    schedule.push({
      orderDays: `${group.name} (${dateRange} ${firstDay.toLocaleDateString('id-ID', { month: 'long' })})`,
      deliveryDay: deliveryDate.toLocaleDateString('id-ID', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    })
  })
  
  return schedule
}
